"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Mail, LogOut, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/features/Useauthstore";

const REASON_CONTENT = {
  subscription_expired: {
    title: "Your Subscription Has Ended",
    body: "Your company's subscription plan has expired. Contact your admin to renew the plan and regain access to ServicePoint.",
    icon: AlertTriangle,
  },
  inactive: {
    title: "Account Deactivated",
    body: "This account has been deactivated by an administrator. Contact your admin to reactivate access.",
    icon: Lock,
  },
};

function RestrictedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const reason = searchParams.get("reason");

  const content = REASON_CONTENT[reason] ?? {
    title: "Access Restricted",
    body: "Your access to this account is currently restricted. Contact your administrator for help.",
    icon: Lock,
  };
  const Icon = content.icon;

  function handleLogout() {
    clearAuth();
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
          <Icon className="h-7 w-7 text-red-500" />
        </span>

        <h1 className="mt-5 text-xl font-semibold text-navy-900">{content.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{content.body}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {/* TODO: point this at your real support email */}
          <a
            href="mailto:support@servicepoint.example"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110"
          >
            <Mail className="h-4 w-4" />
            Contact Admin
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountRestrictedPage() {
  return (
    <Suspense fallback={null}>
      <RestrictedContent />
    </Suspense>
  );
}