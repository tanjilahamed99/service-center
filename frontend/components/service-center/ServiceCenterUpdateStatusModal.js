"use client";

import { useState } from "react";
import { JOB_STATUS_LIST } from "@/components/job/Constants";
import Modal from "../job/Modal";

export default function ServiceCenterUpdateStatusModal({
  open,
  job,
  onClose,
  onUpdateStatus,
}) {
  const [status, setStatus] = useState(job?.status ?? "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !job) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateStatus?.({ jobId: job._id ?? job.id, status, note });
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Status — ${job.complaintNumber ?? ""}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">
          This only changes the job&apos;s status. To reassign an engineer or
          put a job on hold with photos, use Assign or Hold instead.
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Status
          </label>
          <select
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-500 text-black bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400">
            {JOB_STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Note (optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for the change, for the job's log"
            className="w-full rounded-lg border border-gray-500 text-black  bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-500   px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || status === job.status}
            className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {isSubmitting ? "Saving..." : "Update Status"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
