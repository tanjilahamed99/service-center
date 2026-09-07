const TONE_STYLES = {
  electric: "bg-electric-500/10 text-electric-500 ring-electric-500/20",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  red: "bg-red-50 text-red-500 ring-red-200",
  navy: "bg-navy-900/5 text-navy-900 ring-navy-900/10",
  amber: "bg-amber-50 text-amber-500 ring-amber-200",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
};

// One color per job status, matching your JOB_STATUS enum exactly.
const STATUS_TONE = {
  Registered: "electric",
  "Service Center Assigned": "slate",
  "Service Engineer Assigned": "amber",
  Hold: "red",
  Completed: "emerald",
  Cancelled: "slate",
};

export default function StatusBadge({ status, tone }) {
  // `tone` can still be passed explicitly to override, but status always
  // has a sane default — so the color can never silently fail to update.
  const resolvedTone = tone ?? STATUS_TONE[status] ?? "slate";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TONE_STYLES[resolvedTone]}`}>
      {status}
    </span>
  );
}
