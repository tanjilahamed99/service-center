import Link from "next/link";
import { ListChecks, Wrench, PauseCircle, CheckCircle2 } from "lucide-react";

const AGING_STATS = [
  { label: "Pending > 1 Day", value: "3", tone: "amber" },
  { label: "Pending > 3 Days", value: "2", tone: "amber" },
  { label: "Pending > 7 Days", value: "1", tone: "red" },
];

const JOB_STATS = [
  { label: "Total Jobs", value: "86", icon: ListChecks, tone: "navy" },
  { label: "Pending Jobs", value: "6", icon: Wrench, tone: "amber" },
  { label: "Jobs on Hold", value: "2", icon: PauseCircle, tone: "red" },
  { label: "Completed Jobs", value: "78", icon: CheckCircle2, tone: "emerald" },
];

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

export default function ServiceEngineerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome + quick action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
            Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
            Welcome back, Arjun
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

      {/* Aging */}
      <section>
        <SectionHeading
          title="Aging"
          subtitle="Jobs still pending, by how long they've waited"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AGING_STATS.map((stat) => (
            <AgingCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Job status */}
      <section>
        <SectionHeading title="Jobs" subtitle="Jobs associated with you" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JOB_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>
    </div>
  );
}
