"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function AssignJobModal({
  open,
  onClose,
  jobIds = [],
  onAssign,
  serviceCenterOptions = [], // NEW — [{ _id, name }], passed down from JobsListPage
}) {
  const [serviceCenter, setServiceCenter] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setServiceCenter("");
    setScheduleDate("");
    setNote("");
    setError("");
    onClose?.();
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onAssign?.({ jobIds, serviceCenter, scheduleDate, note });
      handleClose();
    } catch (err) {
      // onAssign in JobsListPage currently swallows errors itself, but this
      // guards the modal too in case that changes later.
      setError(err?.response?.data?.message || "Failed to assign job(s).");
    } finally {
      setSubmitting(false);
    }
  }

  const isBulk = jobIds.length > 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        isBulk
          ? `Assign ${jobIds.length} Jobs`
          : `Assign Job ${jobIds[0] ?? ""}`
      }>
      <form onSubmit={handleAssign} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Assign To (Service Center)
          </label>
          <select
            required
            value={serviceCenter}
            onChange={(e) => setServiceCenter(e.target.value)}
            className="w-full text-black rounded-lg border border-gray-500 bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400">
            <option value="">Select service center</option>
            {serviceCenterOptions.map((sc) => (
              <option key={sc._id} value={sc._id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Schedule Date
          </label>
          <input
            type="date"
            required
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full rounded-lg border text-black border-gray-500 bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Note (optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg text-black border border-gray-500 bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {submitting ? "Assigning…" : "Confirm Assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
