"use client";

import {
  FilePlus2,
  UserPlus,
  PauseCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Circle,
} from "lucide-react";
import Modal from "./Modal";

/**
 * Picks an icon + color for a log entry based on its action text. Purely
 * cosmetic — falls back to a neutral dot for anything that doesn't match.
 */
function getLogVisual(action = "") {
  if (/registered/i.test(action)) {
    return { Icon: FilePlus2, tone: "text-slate-500 bg-slate-100" };
  }
  if (/assigned to/i.test(action)) {
    return { Icon: UserPlus, tone: "text-electric-500 bg-electric-500/10" };
  }
  if (/hold/i.test(action)) {
    return { Icon: PauseCircle, tone: "text-amber-500 bg-amber-50" };
  }
  if (/closed|completed/i.test(action)) {
    return { Icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" };
  }
  if (/cancelled/i.test(action)) {
    return { Icon: XCircle, tone: "text-red-500 bg-red-50" };
  }
  if (/status changed/i.test(action)) {
    return { Icon: RefreshCw, tone: "text-slate-500 bg-slate-100" };
  }
  return { Icon: Circle, tone: "text-slate-400 bg-slate-100" };
}

/**
 * Actor strings look like "Service Engineer:6a98575da0524520568a4c48" or
 * plain "Company Admin". Split the role from the id so the id doesn't
 * dominate the line, but keep it available as a short reference.
 */
function parseActor(actor = "") {
  const [role, id] = actor.split(":");
  return { role: role || "Unknown", id };
}

function formatLogDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ViewLogsModal({ open, onClose, job }) {
  const logs = job?.logs ?? [];
  // Show most recent activity first — that's what you want to see first when
  // checking in on a job.
  const sortedLogs = [...logs].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <Modal open={open} onClose={onClose} title={`Job Logs — ${job?.complaintNumber ?? job?.id ?? ""}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {sortedLogs.length} {sortedLogs.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {/* Internally scrollable so the list is always reachable, no matter
          how the surrounding Modal sizes itself. */}
      <div className="max-h-[60vh] overflow-y-auto pr-1 pt-4">
        {sortedLogs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No log entries yet.</p>
        ) : (
          <ol className="space-y-0">
            {sortedLogs.map((log, idx) => {
              const { Icon, tone } = getLogVisual(log.action);
              const { role, id } = parseActor(log.actor);
              const isLast = idx === sortedLogs.length - 1;

              return (
                <li key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm font-medium text-navy-900">{log.action}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatLogDate(log.at)}
                      <span className="mx-1.5">·</span>
                      <span className="font-medium text-slate-500">{role}</span>
                      {id && (
                        <span className="ml-1 font-mono text-[10px] text-slate-300">
                          #{id.slice(-6)}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Modal>
  );
}