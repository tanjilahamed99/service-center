export const JOB_STATUSES = [
  "Registered",
  "Service Center Assigned",
  "Service Engineer Assigned",
  "Hold",
  "Completed",
  "Cancelled",
];

export const STATUS_STYLES = {
  Registered: { badge: "bg-electric-500/10 text-electric-600", dot: "bg-electric-500" },
  "Service Center Assigned": { badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  "Service Engineer Assigned": { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-600" },
  Hold: { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Completed: { badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  Cancelled: { badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diffToText(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// Turn Around Time: only meaningful once a job is solved
export function calcTAT(bookDateTime, solveDate) {
  if (!bookDateTime || !solveDate) return "—";
  const ms = new Date(solveDate).getTime() - new Date(bookDateTime).getTime();
  return ms > 0 ? diffToText(ms) : "—";
}

// Aging: how long a job has been sitting unsolved
export function calcAging(bookDateTime, solveDate) {
  if (solveDate) return "—";
  if (!bookDateTime) return "—";
  const ms = Date.now() - new Date(bookDateTime).getTime();
  return ms > 0 ? diffToText(ms) : "—";
}

export function generateComplaintNo() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${y}${m}${d}-${rand}`;
}