import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 px-6 py-16">
      {/* Ambient circuit-dot backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          color: "#38bdf8",
        }}
        aria-hidden="true"
      />
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-electric-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-electric-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric-500/15 ring-1 ring-electric-400/40">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-electric-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <rect x="7" y="7" width="10" height="10" rx="1.5" />
              <path
                strokeLinecap="round"
                d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"
              />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Aceit Technologies (P)ltd
          </span>
        </div>

        <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-electric-400">
          Error 404 // No signal
        </p>

        {/* Flatlined trace: signature element for the "lost signal" state */}
        <svg
          viewBox="0 0 400 90"
          className="mx-auto mt-6 w-full max-w-xs text-electric-400"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 45 H140 L155 20 L170 70 L185 45 H215"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d="M215 45 H400"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 8"
            strokeLinecap="round"
            opacity="0.35"
          />
          <circle cx="215" cy="45" r="4" fill="currentColor" opacity="0.9" />
        </svg>

        <h1 className="mt-6 text-3xl font-semibold leading-snug text-white lg:text-4xl">
          This page didn&apos;t come through.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
          The page you&apos;re looking for may have been moved, renamed, or
          never existed. Let&apos;s get you back on the line.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-electric-500/25 sm:w-auto"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
            </svg>
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Still stuck?{" "}
          <Link href="/complaint" className="font-medium text-electric-400 hover:text-electric-300">
            Report an issue
          </Link>
        </p>
      </div>
    </div>
  );
}