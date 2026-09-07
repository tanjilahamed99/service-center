"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/actions/company";

function StatCard({ label, value, icon: Icon, tone }) {
  const TONE_STYLES = {
    electric: "bg-electric-500/10 text-electric-500 ring-electric-500/20",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    red: "bg-red-50 text-red-500 ring-red-200",
    navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
    amber: "bg-amber-50 text-amber-500 ring-amber-200",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:shadow-md hover:shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${TONE_STYLES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
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
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/50 transition hover:shadow-md hover:shadow-slate-200/60">
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

const jobIcon = (d) => (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data?.data))
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setError("Failed to load dashboard stats.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading dashboard…</p>;
  }
  if (error || !stats) {
    return (
      <p className="text-sm font-medium text-red-500">{error || "No data."}</p>
    );
  }

  const agingStats = [
    {
      label: "Pending > 1 Day",
      value: String(stats.aging.overOneDay),
      tone: "amber",
    },
    {
      label: "Pending > 3 Days",
      value: String(stats.aging.overThreeDays),
      tone: "amber",
    },
    {
      label: "Pending > 7 Days",
      value: String(stats.aging.overSevenDays),
      tone: "red",
    },
  ];

  const jobStats = [
    {
      label: "Total Jobs",
      value: stats.jobs.total.toLocaleString(),
      tone: "navy",
      icon: jobIcon(
        "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
      ),
    },
    {
      label: "Registered Jobs",
      value: stats.jobs.registered.toLocaleString(),
      tone: "electric",
      icon: jobIcon("M12 5v14M5 12h14"),
    },
    {
      label: "Pending at Service Center",
      value: stats.jobs.pendingAtServiceCenter.toLocaleString(),
      tone: "amber",
      icon: jobIcon(
        "M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.6 2.6-2-2 2.6-2.6z",
      ),
    },
    {
      label: "Pending at Service Engineer",
      value: stats.jobs.pendingAtServiceEngineer.toLocaleString(),
      tone: "amber",
      icon: jobIcon(
        "M12 8a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM4.5 20a7.5 7.5 0 0115 0",
      ),
    },
    {
      label: "Jobs on Hold",
      value: stats.jobs.onHold.toLocaleString(),
      tone: "red",
      icon: jobIcon("M6 4h4v16H6zM14 4h4v16h-4z"),
    },
    {
      label: "Completed Jobs",
      value: stats.jobs.completed.toLocaleString(),
      tone: "emerald",
      icon: jobIcon("M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    },
  ];

  const networkStats = [
    {
      label: "Service Centers",
      value: `${stats.serviceCenters.active} / ${stats.serviceCenters.total}`,
      tone: "electric",
      icon: jobIcon(
        "M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.6 2.6-2-2 2.6-2.6z",
      ),
    },
    {
      label: "Service Engineers",
      value: `${stats.serviceEngineers.active} / ${stats.serviceEngineers.total}`,
      tone: "navy",
      icon: jobIcon(
        "M12 8a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM4.5 20a7.5 7.5 0 0115 0",
      ),
    },
  ];

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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Create Job
        </Link>
      </div>

      {/* Aging */}
      <section>
        <SectionHeading
          title="Aging"
          subtitle="Jobs still pending, by how long they've waited"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {agingStats.map((stat) => (
            <AgingCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Job status */}
      <section>
        <SectionHeading title="Jobs" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Network */}
      <section>
        <SectionHeading title="Network" subtitle="Active / Total" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {networkStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>
    </div>
  );
}
