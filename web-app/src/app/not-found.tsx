import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center space-y-4">
        <p className="text-8xl font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/home"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
