import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-5xl font-light text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page doesn't exist or was moved.</p>
      <Link href="/" className="mt-2 text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors">
        Go home
      </Link>
    </div>
  );
}
