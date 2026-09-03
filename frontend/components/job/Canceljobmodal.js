"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function CancelJobModal({ open, onClose, job, onCancelJob }) {
  const [reason, setReason] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onCancelJob?.({ jobId: job?.id, reason });
    setReason("");
    onClose?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Cancel Job ${job?.id ?? ""}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">
          Cancelling requires a reason. This will be visible on the Cancelled Jobs page.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">Reason for Cancellation</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer purchased a new unit instead of repair"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-red-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Keep Job
          </button>
          <button
            type="submit"
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Cancel Job
          </button>
        </div>
      </form>
    </Modal>
  );
}