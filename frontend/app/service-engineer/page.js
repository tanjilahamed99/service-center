"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  Wrench,
  PauseCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
} from "lucide-react";
import { getDashboardStats } from "@/actions/service-engineer";

// ---------------------------------------------------------------------------
// Tone styles
// ---------------------------------------------------------------------------
const TONE_STYLES = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  red: "bg-red-50 text-red-500 ring-red-200",
  navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
  amber: "bg-amber-50 text-amber-500 ring-amber-200",
  electric: "bg-electric-500/10 text-electric-600 ring-electric-500/30",
  violet: "bg-violet-50 text-violet-600 ring-violet-200",
};

// ---------------------------------------------------------------------------
// Card definitions — only engineer-relevant statuses
// ---------------------------------------------------------------------------
const STATUS_CARDS = [
  {
    key: "totalJobs",
    label: "Total Jobs",
    icon: ListChecks,
    tone: "navy",
  },
  {
    key: "pendingJobs",
    label: "Pending",
    icon: Wrench,
    tone: "amber",
  },
  {
    key: "jobsOnHold",
    label: "On Hold",
    icon: PauseCircle,
    tone: "amber",
  },
  {
    key: "completedJobs",
    label: "Completed",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    key: "cancelledJobs",
    label: "Cancelled",
    icon: XCircle,
    tone: "red",
  },
  {
    key: "openJobs",
    label: "Open (In Progress)",
    icon: Clock,
    tone: "violet",
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function StatCard({ label, value, icon: Icon, tone, href }) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-electric-400/60 hover:shadow-md">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${TONE_STYLES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-navy-900">
        {value ?? 0}
      </p>
      <p className="mt-1 text-sm text-slate-500 group-hover:text-slate-700">
        {label}
      </p>
    </Wrapper>
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

function AgingCard({ label, value, tone }) {
  const dot = tone === "red" ? "bg-red-500" : "bg-amber-500";
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-lg font-semibold text-navy-900">{value ?? 0}</span>
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
      {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ServiceEngineerDashboardPage() {
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
      setError(
        err.response?.data?.message ||
          "Couldn't load dashboard stats. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const agingStats = stats
    ? [
        { label: "Pending > 1 Day", value: stats.pending1Day, tone: "amber" },
        { label: "Pending > 3 Days", value: stats.pending3Days, tone: "amber" },
        { label: "Pending > 7 Days", value: stats.pending7Days, tone: "red" },
      ]
    : [];

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
            Here&apos;s what&apos;s waiting on you today.
          </p>
        </div>
        <Link
          href="/service-engineer/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          View Jobs
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Aging */}
      <section>
        <SectionHeading
          title="Aging"
          subtitle="Jobs assigned to you, by how long they've been waiting"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <AgingCardSkeleton key={i} />
              ))
            : agingStats.map((stat) => (
                <AgingCard key={stat.label} {...stat} />
              ))}
        </div>
      </section>

      {/* Jobs by status */}
      <section>
        <SectionHeading
          title="Jobs by Status"
          subtitle="Every status a job can be in while it's assigned to you"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: STATUS_CARDS.length }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : STATUS_CARDS.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={
                    stats?.[card.key] ??
                    (stats?.byStatus && card.key === "pendingJobs"
                      ? stats.byStatus["Service Engineer Assigned"]
                      : 0)
                  }
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
