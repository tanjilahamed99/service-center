"use client";

import { useState } from "react";
import Modal from "../job/Modal";

export default function ServiceCenterAssignJobModal({
  open,
  onClose,
  jobIds = [],
  serviceEngineerOptions = [],
  onAssign,
}) {
  const [serviceEngineer, setServiceEngineer] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [note, setNote] = useState("");

  function handleAssign(e) {
    e.preventDefault();
    onAssign?.({ jobIds, serviceEngineer, scheduleDate, note });
    setServiceEngineer("");
    setScheduleDate("");
    setNote("");
    onClose?.();
  }

  const isBulk = jobIds.length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isBulk
          ? `Assign ${jobIds.length} Jobs`
          : `Assign Job ${jobIds[0] ?? ""}`
      }>
      <form onSubmit={handleAssign} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Assign To (Service Engineer)
          </label>
          <select
            required
            value={serviceEngineer}
            onChange={(e) => setServiceEngineer(e.target.value)}
            className="w-full rounded-lg border text-black border-gray-500  bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400">
            <option value="">Select service engineer</option>
            {serviceEngineerOptions.map((eng) => (
              <option key={eng._id} value={eng._id}>
                {eng.name}
              </option>
            ))}
          </select>
          {serviceEngineerOptions.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-400">
              No service engineers found. Add one from the Service Engineers
              page first.
            </p>
          )}
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
            className=" text-black w-full rounded-lg border border-gray-500  bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
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
            className="w-full rounded-lg border text-black border-gray-500  bg-slate-50 px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-500  px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-electric-500 px-4 py-2 text-[12px] md:text-sm font-semibold text-white hover:brightness-110">
            Confirm Assignment
          </button>
        </div>
      </form>
    </Modal>
  );
}
