"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks, Wrench, PauseCircle, CheckCircle2 } from "lucide-react";
import { serviceEngineerJobs } from "@/actions/service-engineer"; // adjust to your actual api module path

const TONE_STYLES = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  red: "bg-red-50 text-red-500 ring-red-200",
  navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
  amber: "bg-amber-50 text-amber-500 ring-amber-200",
};

// Adjust these if your job documents use different status strings.
const STATUS = {
  PENDING: "Pending",
  HOLD: "Hold",
  COMPLETED: "Completed",
};

function daysSince(dateLike) {
  if (!dateLike) return 0;
  const diffMs = Date.now() - new Date(dateLike).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

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

function StatSkeleton({ count, className }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[92px] animate-pulse rounded-xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function ServiceEngineerDashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await serviceEngineerJobs({});
      setJobs(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load jobs", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const jobStats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === STATUS.PENDING).length;
    const onHold = jobs.filter((j) => j.status === STATUS.HOLD).length;
    const completed = jobs.filter((j) => j.status === STATUS.COMPLETED).length;

    return [
      { label: "Total Jobs", value: total, icon: ListChecks, tone: "navy" },
      { label: "Pending Jobs", value: pending, icon: Wrench, tone: "amber" },
      { label: "Jobs on Hold", value: onHold, icon: PauseCircle, tone: "red" },
      {
        label: "Completed Jobs",
        value: completed,
        icon: CheckCircle2,
        tone: "emerald",
      },
    ];
  }, [jobs]);

  const agingStats = useMemo(() => {
    const pendingJobs = jobs.filter((j) => j.status === STATUS.PENDING);
    const over1 = pendingJobs.filter((j) => daysSince(j.createdAt) > 1).length;
    const over3 = pendingJobs.filter((j) => daysSince(j.createdAt) > 3).length;
    const over7 = pendingJobs.filter((j) => daysSince(j.createdAt) > 7).length;

    return [
      { label: "Pending > 1 Day", value: over1, tone: "amber" },
      { label: "Pending > 3 Days", value: over3, tone: "amber" },
      { label: "Pending > 7 Days", value: over7, tone: "red" },
    ];
  }, [jobs]);

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
            Here&apos;s what&apos;s on your plate today.
          </p>
        </div>
        <Link
          href="/service-engineer/jobs/pending"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          View Pending Jobs
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button
            onClick={fetchJobs}
            className="font-semibold underline underline-offset-2">
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
        {loading ? (
          <StatSkeleton
            count={3}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {agingStats.map((stat) => (
              <AgingCard key={stat.label} {...stat} />
            ))}
          </div>
        )}
      </section>

      {/* Job status */}
      <section>
        <SectionHeading title="Jobs" subtitle="Jobs associated with you" />
        {loading ? (
          <StatSkeleton
            count={4}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
