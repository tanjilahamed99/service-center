"use client";

import Modal from "./Modal";

// Placeholder log trail — replace with the job's real `logs` array from the API.
function buildMockLogs(job) {
  if (!job) return [];
  const logs = [{ at: job.bookDateTime, actor: "System", action: `Job ${job.id} registered` }];
  if (job.assignedDateTime) {
    logs.push({ at: job.assignedDateTime, actor: "Company Admin", action: `Assigned to ${job.assignedTo}` });
  }
  if (job.holdReason) {
    logs.push({ at: job.scheduleDate, actor: "Service Engineer", action: `Marked on hold — ${job.holdReason}` });
  }
  if (job.solveDate) {
    logs.push({ at: job.solveDate, actor: "Service Engineer", action: "Job closed" });
  }
  if (job.cancelReason) {
    logs.push({ at: job.bookDateTime, actor: "Company Admin", action: `Cancelled — ${job.cancelReason}` });
  }
  return logs;
}

export default function ViewLogsModal({ open, onClose, job }) {
  const logs = buildMockLogs(job);

  return (
    <Modal open={open} onClose={onClose} title={`Job Logs — ${job?.id ?? ""}`}>
      <ol className="space-y-4">
        {logs.map((log, idx) => (
          <li key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-electric-500" />
              {idx !== logs.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-navy-900">{log.action}</p>
              <p className="text-xs text-slate-400">{log.at} · {log.actor}</p>
            </div>
          </li>
        ))}
        {logs.length === 0 && <p className="text-sm text-slate-400">No log entries yet.</p>}
      </ol>
    </Modal>
  );
}