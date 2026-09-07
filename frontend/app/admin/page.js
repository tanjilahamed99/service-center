// app/admin/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminDashboardStats } from "@/actions/admin";

const TONE_STYLES = {
  electric: "bg-electric-500/10 text-electric-500 ring-electric-500/20",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  red: "bg-red-50 text-red-500 ring-red-200",
  navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
  amber: "bg-amber-50 text-amber-500 ring-amber-200",
};

function StatCard({ label, value, icon: Icon, tone }) {
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

const icon = (d) => (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboardStats()
      .then((res) => setStats(res.data?.data))
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setError("Failed to load dashboard stats.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-sm text-slate-400">Loading dashboard…</p>;
  if (error || !stats)
    return (
      <p className="text-sm font-medium text-red-500">{error || "No data."}</p>
    );

  const companyStats = [
    {
      label: "Total Companies",
      value: stats.companies.total.toLocaleString(),
      tone: "electric",
      icon: icon(
        "M4 21V5a1 1 0 011-1h6a1 1 0 011 1v16M16 21v-9a1 1 0 011-1h3a1 1 0 011 1v9M8 7h.01M8 11h.01M8 15h.01",
      ),
    },
    {
      label: "Active Companies",
      value: stats.companies.active.toLocaleString(),
      tone: "emerald",
      icon: icon("M4 13l5 5L20 6"),
    },
    {
      label: "Suspended Companies",
      value: stats?.companies?.suspended?.toLocaleString() || 0,
      tone: "red",
      icon: icon("M9.5 9.5l5 5M14.5 9.5l-5 5"),
    },
  ];

  const complaintStats = [
    {
      label: "Total Complaints",
      value: stats.complaints.total.toLocaleString(),
      tone: "navy",
      icon: icon("M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"),
    },
    {
      label: "Pending Complaints",
      value: stats.complaints.pending.toLocaleString(),
      tone: "amber",
      icon: icon("M12 7v5l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    },
    {
      label: "Completed Complaints",
      value: stats.complaints.completed.toLocaleString(),
      tone: "emerald",
      icon: icon("M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
            Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
            Welcome back, Super Admin
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening across all companies today.
          </p>
        </div>
        <Link
          href="/admin/companies/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Company
        </Link>
      </div>

      <section>
        <SectionHeading title="Companies" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companyStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Complaints"
          subtitle="Across all companies and service centers"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {complaintStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>
    </div>
  );
}
