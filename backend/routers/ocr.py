import base64
import io
import json
import logging
import os
import time

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from PIL import Image
from pillow_heif import register_heif_opener
from pydantic import BaseModel

register_heif_opener()  # enables PIL to open HEIC/HEIF files

from auth import verify_token
from models import User

router = APIRouter()
log = logging.getLogger(__name__)
_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# claude-haiku-4-5 pricing: $1.00/MTok input, $5.00/MTok output
_INPUT_COST_PER_TOKEN = 1.00 / 1_000_000
_OUTPUT_COST_PER_TOKEN = 5.00 / 1_000_000
_MAX_WIDTH = 1200

_PROMPT = (
    "Look at this image and identify up to 3 passages of text worth saving as a quote. "
    "Each candidate must be a complete, meaningful passage — at least one full sentence. "
    "Do NOT include headings, labels, page numbers, single words, short phrases, or sentence fragments. "
    "If a passage spans multiple sentences that form a coherent thought, include them together as one candidate. "
    "Fill candidate1 first, then candidate2, then candidate3. "
    "If there are fewer than 3 passages that meet the criteria, set the remaining candidates to empty string."
)

_OUTPUT_CONFIG = {
    "format": {
        "type": "json_schema",
        "schema": {
            "type": "object",
            "properties": {
                "candidate1": {"type": "string"},
                "candidate2": {"type": "string"},
                "candidate3": {"type": "string"},
            },
            "required": ["candidate1", "candidate2", "candidate3"],
            "additionalProperties": False,
        },
    }
}

# Claude-supported MIME types and their magic bytes
_MAGIC = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"RIFF", "image/webp"),
    (b"GIF8", "image/gif"),
]


class OCRRequest(BaseModel):
    image: str  # base64-encoded image
    selection_x: float | None = None
    selection_y: float | None = None
    selection_w: float | None = None
    selection_h: float | None = None


def _strip_prefix(b64: str) -> str:
    """Remove data URL prefix like 'data:image/jpeg;base64,' if present."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return b64.strip()


def _detect_mime(raw: bytes) -> str:
    for magic, mime in _MAGIC:
        if raw[:len(magic)] == magic:
            if mime == "image/webp" and raw[8:12] != b"WEBP":
                continue
            return mime
    # HEIC/HEIF: ISO base media file — bytes 4-7 are 'ftyp'
    if raw[4:8] == b"ftyp":
        return "image/heic"
    return "image/jpeg"  # fallback


def _try_resize(b64: str) -> tuple[str, str]:
    """
    Resize to _MAX_WIDTH if possible. Returns (b64, mime_type).
    Falls back to original if PIL cannot open the format (e.g. HEIC).
    """
    raw = base64.b64decode(b64)
    mime = _detect_mime(raw)
    log.info("OCR image format detected: %s (%d raw bytes)", mime, len(raw))

    try:
        img = Image.open(io.BytesIO(raw))
        log.info("OCR original dimensions: %dx%d", img.width, img.height)
        if img.width > _MAX_WIDTH:
            ratio = _MAX_WIDTH / img.width
            img = img.resize((_MAX_WIDTH, int(img.height * ratio)), Image.LANCZOS)
        if img.mode != "RGB":
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=80)
        resized_b64 = base64.b64encode(out.getvalue()).decode()
        log.info("OCR resized to %dx%d, ~%d KB", img.width, img.height, len(out.getvalue()) // 1024)
        return resized_b64, "image/jpeg"
    except Exception as e:
        log.warning("OCR PIL resize failed (%s) — sending original to Claude", e)
        return b64, mime


def _apply_selection(b64: str, sx: float, sy: float, sw: float, sh: float) -> str:
    """Crop the image to the normalised selection rect before sending to Claude."""
    raw = base64.b64decode(b64)
    try:
        img = Image.open(io.BytesIO(raw))
        if img.mode != "RGB":
            img = img.convert("RGB")
        x = int(sx * img.width)
        y = int(sy * img.height)
        w = int(sw * img.width)
        h = int(sh * img.height)
        img = img.crop((x, y, min(img.width, x + w), min(img.height, y + h)))
        log.info("OCR cropped to selection: (%d,%d) %dx%d", x, y, w, h)
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=85)
        return base64.b64encode(out.getvalue()).decode()
    except Exception as e:
        log.warning("OCR selection crop failed (%s) — using original", e)
        return b64


@router.post("/ocr")
def ocr(body: OCRRequest, current_user: User = Depends(verify_token)):
    log.info("OCR request received — base64 len %d", len(body.image))

    b64 = _strip_prefix(body.image)
    log.info("OCR first 40 chars of b64: %r", b64[:40])

    has_selection = all(
        v is not None for v in [body.selection_x, body.selection_y, body.selection_w, body.selection_h]
    ) and body.selection_w > 0.05 and body.selection_h > 0.05  # type: ignore[operator]

    if has_selection:
        b64 = _apply_selection(b64, body.selection_x, body.selection_y, body.selection_w, body.selection_h)  # type: ignore[arg-type]

    t0 = time.time()
    image_b64, mime = _try_resize(b64)
    log.info("OCR prepare took %.2fs, mime=%s", time.time() - t0, mime)

    log.info("OCR calling claude-haiku-4-5 …")
    t_claude = time.time()
    try:
        response = _client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            output_config=_OUTPUT_CONFIG,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime,
                                "data": image_b64,
                            },
                        },
                        {"type": "text", "text": _PROMPT},
                    ],
                }
            ],
        )
        elapsed = time.time() - t_claude
        usage = response.usage
        cost = usage.input_tokens * _INPUT_COST_PER_TOKEN + usage.output_tokens * _OUTPUT_COST_PER_TOKEN
        log.info("OCR claude %.2fs — in:%d out:%d cost:$%.6f",
                 elapsed, usage.input_tokens, usage.output_tokens, cost)

        result = json.loads(response.content[0].text)
        candidates = [result["candidate1"], result["candidate2"], result["candidate3"]]
        for i, c in enumerate(candidates, 1):
            log.info("OCR candidate %d: %r", i, c[:120])

        return {"sentences": candidates}
    except Exception as e:
        log.exception("OCR error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
