"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ListChecks,
  Wrench,
  PauseCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { getDashboardStats } from "@/actions/service-engineer";

const TONE_STYLES = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  red: "bg-red-50 text-red-500 ring-red-200",
  navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
  amber: "bg-amber-50 text-amber-500 ring-amber-200",
};

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${TONE_STYLES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-navy-900">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
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

function AgingCard({ label, value, tone }) {
  const dot = tone === "red" ? "bg-red-500" : "bg-amber-500";
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-lg font-semibold text-navy-900">{value}</span>
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

export default function ServiceCenterDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await getDashboardStats();
      setStats(data.data);
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

  const jobStats = stats
    ? [
        {
          label: "Total Jobs",
          value: stats.totalJobs,
          icon: ListChecks,
          tone: "navy",
        },
        {
          label: "Pending at Service Center",
          value: stats.pendingAtServiceCenter,
          icon: Wrench,
          tone: "amber",
        },
        {
          label: "Jobs on Hold",
          value: stats.jobsOnHold,
          icon: PauseCircle,
          tone: "red",
        },
        {
          label: "Completed Jobs",
          value: stats.completedJobs,
          icon: CheckCircle2,
          tone: "emerald",
        },
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
            Here&apos;s what&apos;s waiting on your team today.
          </p>
        </div>
        <Link
          href="/service-center/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          View Jobs
        </Link>
      </div>

      {/* Error state */}
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
          subtitle="Jobs still pending, by how long they've waited"
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

      {/* Job status */}
      <section>
        <SectionHeading title="Jobs" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : jobStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
      </section>
    </div>
  );
}
