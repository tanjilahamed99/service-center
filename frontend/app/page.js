"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { useAuthStore } from "@/features/Useauthstore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = e.target.identifier.value;
      const password = e.target.password.value;
      const userData = {
        email,
        password,
      };

      const { data } = await login(userData);

      if (data.success) {
        setAuth({ token: data.token, user: data.user });
        toast.success("Login successful");
        const role = data.user.role;
        if (role === "admin") {
          router.push("/admin");
        } else if (role === "company") {
          router.push("/company");
        } else if (role === "service-center") {
          router.push("/service-center");
        } else if (role === "service-engineer") {
          router.push("/service-engineer");
        }
      }
    } catch (error) {
      console.log(error);
      const message = error?.response?.data?.message || "Something went wrong";

      toast.error(message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Brand / diagnostic panel */}
      <div className="relative overflow-hidden bg-navy-900 px-8 py-10 lg:w-1/2 lg:min-h-screen lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14">
        {/* Ambient circuit-dot backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
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

        {/* Logo + brand */}
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric-500/15 ring-1 ring-electric-400/40">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-electric-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75">
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

        {/* Headline + signal trace */}
        <div className="relative mt-10 lg:mt-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-electric-400">
            Service Portal // Sign in
          </p>
          <h1 className="mt-3 max-w-sm text-2xl font-semibold leading-snug text-white lg:text-3xl">
            Track every repair from intake to resolution.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            One system for complaint intake, branch assignment, and status
            updates &mdash; built for your admins, branch managers, and
            technicians.
          </p>

          <svg
            viewBox="0 0 400 90"
            className="mt-8 hidden w-full max-w-sm text-electric-400 lg:block"
            fill="none"
            aria-hidden="true">
            <path
              d="M0 45 H60 L75 15 L95 75 L115 45 H160 L175 60 L195 30 L215 45 H400"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-trace-draw"
            />
            <circle
              cx="215"
              cy="45"
              r="4"
              fill="currentColor"
              className="animate-pulse-dot"
            />
          </svg>
        </div>

        {/* Footer note */}
        <p className="relative mt-10 hidden text-xs text-slate-500 lg:block">
          &copy; {new Date().getFullYear()} Aceit Technologies (P)ltd. All systems
          operational.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-navy-900">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your credentials to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email / staff ID */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-sm font-medium text-navy-900">
                Email or staff ID
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7l9 6 9-6"
                    />
                  </svg>
                </span>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="you@servicecenter.com"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-navy-900 placeholder:text-slate-400 outline-none transition focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-navy-900">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-electric-500 hover:text-electric-400">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-navy-900 placeholder:text-slate-400 outline-none transition focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-navy-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4.5 w-4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18M10.6 10.7a3 3 0 004.2 4.2M9.3 5.4A10.4 10.4 0 0112 5c5 0 9 4 10 7-1 1.6-2.6 3.4-4.5 4.6M6.2 6.2C4.3 7.4 2.9 9.1 2 10.7c1 3 5 7 10 7 1.1 0 2.1-.2 3.1-.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4.5 w-4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-slate-300 text-electric-500 focus:ring-electric-500/40"
              />
              Keep me signed in
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-electric-500/25 disabled:cursor-not-allowed disabled:opacity-70">
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M13 6l6 6-6 6"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Need to report an issue instead?{" "}
            <Link
              href="/complaint"
              className="font-medium text-electric-500 hover:text-electric-400">
              Submit a complaint
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
