"use client";

import { useState } from "react";
import { X } from "lucide-react";

// TODO: move this alongside JOB_STATUS in ../job/Constants if that file is
// the shared source of truth for enums in this codebase.
const HOLD_SUB_STATUS = [
  "Pending From Approval",
  "Customer Not Available",
  "Spare Part Shortage",
  "Spare Ordered",
  "Product to Service Center for Repair",
];

export default function HoldJobModal({ open, job, onClose, onHold }) {
  const [holdSubStatus, setHoldSubStatus] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [holdRemarks, setHoldRemarks] = useState("");
  const [photoCount, setPhotoCount] = useState(0); // TODO: wire to real upload/capture
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !job) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!holdSubStatus) {
      setError("Select a reason for hold.");
      return;
    }
    if (photoCount < 2 || photoCount > 5) {
      setError("Attach between 2 and 5 photos.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onHold({
        jobId: job._id,
        holdSubStatus,
        holdReason,
        holdPhotos: Array.from({ length: photoCount }, (_, i) => `placeholder-${i}.jpg`), // TODO: real upload
        holdRemarks,
      });
      // Reset local form state for next use
      setHoldSubStatus("");
      setHoldReason("");
      setHoldRemarks("");
      setPhotoCount(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Hold Job — {job.complaintNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Reason for Hold <span className="text-red-500">*</span>
            </label>
            <select
              value={holdSubStatus}
              onChange={(e) => setHoldSubStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
            >
              <option value="">Select a reason...</option>
              {HOLD_SUB_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Additional Detail
            </label>
            <input
              type="text"
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="Optional short note"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Photos (2–5 required) <span className="text-red-500">*</span>
            </label>
            {/* TODO: replace with a real file/camera upload component */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPhotoCount((c) => Math.max(0, c - 1))}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium text-navy-900">
                {photoCount}
              </span>
              <button
                type="button"
                onClick={() => setPhotoCount((c) => Math.min(5, c + 1))}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                +
              </button>
              <span className="text-xs text-slate-400">photos attached (placeholder counter)</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">Remarks</label>
            <textarea
              rows={2}
              value={holdRemarks}
              onChange={(e) => setHoldRemarks(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Put on Hold"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}