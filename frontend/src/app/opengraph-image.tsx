import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#f5f0e8",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
        }}
      >
        {/* Icon + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width={56} height={56}>
            <rect width="32" height="32" rx="8" fill="#1a1a1a" />
            <path d="M7 20 C7 17 9 14 12 13 L12 11 C7 12 4 16 4 20 L4 24 L9 24 L9 20 Z" fill="#f5f0e8" />
            <path d="M17 20 C17 17 19 14 22 13 L22 11 C17 12 14 16 14 20 L14 24 L19 24 L19 20 Z" fill="#f5f0e8" />
            <circle cx="26" cy="22" r="3" fill="#c9a96e" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
            Gleaning
          </span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 52, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.1 }}>
          Quotes. Keep the best.
          <br />
          Nothing else.
        </div>
      </div>
    ),
    { ...size }
  );
}
