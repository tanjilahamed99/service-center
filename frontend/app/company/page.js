"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { getDashboardStats } from "@/actions/company";

// ---------------------------------------------------------------------------
// Tone styles
// ---------------------------------------------------------------------------
const TONE_STYLES = {
  electric: "bg-electric-500/10 text-electric-500 ring-electric-500/20",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  red: "bg-red-50 text-red-500 ring-red-200",
  navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
  amber: "bg-amber-50 text-amber-500 ring-amber-200",
  orange: "bg-orange-50 text-orange-500 ring-orange-200",
  violet: "bg-violet-50 text-violet-600 ring-violet-200",
};

// ---------------------------------------------------------------------------
// Card definitions — one source of truth for labels, tones, and links
// ---------------------------------------------------------------------------
const JOB_CARDS = [
  {
    key: "total",
    label: "Total Jobs",
    tone: "navy",
    href: "/company/jobs",
    icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  },
  {
    key: "registered",
    label: "Registered Jobs",
    tone: "electric",
    href: "/company/jobs?status=Registered",
    icon: "M12 5v14M5 12h14",
  },
  {
    key: "pendingAtServiceCenter",
    label: "Pending at Service Center",
    tone: "amber",
    href: "/company/jobs?status=Service%20Center%20Assigned",
    icon: "M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.6 2.6-2-2 2.6-2.6z",
  },
  {
    key: "pendingAtServiceEngineer",
    label: "Pending at Service Engineer",
    tone: "amber",
    href: "/company/jobs?status=Service%20Engineer%20Assigned",
    icon: "M12 8a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM4.5 20a7.5 7.5 0 0115 0",
  },
  {
    key: "onHold",
    label: "Jobs on Hold",
    tone: "orange",
    href: "/company/jobs?status=Hold",
    icon: "M6 4h4v16H6zM14 4h4v16h-4z",
  },
  {
    key: "cancel",
    label: "Cancelled Jobs",
    tone: "red",
    href: "/company/jobs?status=Cancelled",
    icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM4.93 4.93l14.14 14.14",
  },
  {
    key: "completed",
    label: "Completed Jobs",
    tone: "emerald",
    href: "/company/jobs?status=Completed",
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "open",
    label: "Open (In Progress)",
    tone: "violet",
    href: "/company/jobs",
    icon: "M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const AGING_CARDS = [
  { key: "overOneDay", label: "Pending > 1 Day", tone: "amber" },
  { key: "overThreeDays", label: "Pending > 3 Days", tone: "amber" },
  { key: "overSevenDays", label: "Pending > 7 Days", tone: "red" },
];

const NETWORK_CARDS = [
  {
    key: "serviceCenters",
    label: "Service Centers",
    tone: "electric",
    href: "/company/service-centers",
    icon: "M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.6 2.6-2-2 2.6-2.6z",
  },
  {
    key: "serviceEngineers",
    label: "Service Engineers",
    tone: "navy",
    href: "/company/service-engineers",
    icon: "M12 8a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM4.5 20a7.5 7.5 0 0115 0",
  },
];

// ---------------------------------------------------------------------------
// Inline icon component (path-based)
// ---------------------------------------------------------------------------
function PathIcon({ d, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------
function StatCard({ label, value, icon, tone, href }) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-electric-400/60 hover:shadow-md hover:shadow-slate-200/60"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${TONE_STYLES[tone]}`}
        >
          <PathIcon d={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-navy-900">
        {value ?? 0}
      </p>
      <p className="mt-1 text-sm text-slate-500 group-hover:text-slate-700">
        {label}
      </p>
    </Wrapper>
  );
}

function AgingCard({ label, value, tone }) {
  const dot = tone === "red" ? "bg-red-500" : "bg-amber-500";
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/50 transition hover:shadow-md hover:shadow-slate-200/60">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-lg font-semibold text-navy-900">
        {value ?? 0}
      </span>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="h-10 w-10 rounded-lg bg-slate-100" />
      <div className="mt-4 h-7 w-16 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-28 rounded bg-slate-100" />
    </div>
  );
}

function AgingCardSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="h-4 w-28 rounded bg-slate-100" />
      <div className="h-5 w-8 rounded bg-slate-100" />
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CompanyDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getDashboardStats();
      setStats(res?.data?.data ?? null);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard stats. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Resolve a card's value from stats.
  function valueFor(section, card) {
    if (!stats) return 0;

    if (section === "jobs") {
      // Prefer top-level rollup, fall back to byStatus.
      if (card.key === "total") return stats.jobs?.total ?? 0;
      if (card.key === "open") return stats.jobs?.open ?? 0;
      return stats.jobs?.[card.key] ?? 0;
    }

    if (section === "aging") {
      return stats.aging?.[card.key] ?? 0;
    }

    if (section === "network") {
      const s = stats[card.key];
      if (!s) return "0 / 0";
      return `${s.active ?? 0} / ${s.total ?? 0}`;
    }

    return 0;
  }

  return (
    <div className="space-y-8">
      {/* Welcome + quick action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
            Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s the status of every job across your service network.
          </p>
        </div>
        <Link
          href="/company/jobs/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Create Job
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Aging */}
      <section>
        <SectionHeading
          title="Aging"
          subtitle="Open jobs, by how long they've been waiting"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <AgingCardSkeleton key={i} />
              ))
            : AGING_CARDS.map((card) => (
                <AgingCard
                  key={card.key}
                  label={card.label}
                  value={valueFor("aging", card)}
                  tone={card.tone}
                />
              ))}
        </div>
      </section>

      {/* Jobs */}
      <section>
        <SectionHeading
          title="Jobs"
          subtitle="Every status across all jobs you've registered"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: JOB_CARDS.length }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : JOB_CARDS.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={valueFor("jobs", card).toLocaleString?.() ??
                    valueFor("jobs", card)}
                  icon={card.icon}
                  tone={card.tone}
                  href={card.href}
                />
              ))}
        </div>
      </section>

      {/* Network */}
      <section>
        <SectionHeading title="Network" subtitle="Active / Total" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: NETWORK_CARDS.length }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : NETWORK_CARDS.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={valueFor("network", card)}
                  icon={card.icon}
                  tone={card.tone}
                  href={card.href}
                />
              ))}
        </div>
      </section>
    </div>
  );
}