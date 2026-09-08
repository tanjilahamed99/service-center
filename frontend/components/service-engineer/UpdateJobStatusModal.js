"use client";

import { useState } from "react";
import Modal from "../job/Modal";
import UploadImage from "../UploadImage";
import SparePartsPicker from "./SparePartsPicker";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400";

const HOLD_SUB_STATUS_OPTIONS = [
  "Pending From Approval",
  "Customer Not Available",
  "Spare Part Shortage",
  "Spare Ordered",
  "Product to Service Center for Repair",
];

const ACTUAL_ISSUE_OPTIONS = [
  "Service Required",
  "RF PCB Problem",
  "RF LED PCB",
  "Wiring Fault",
  "New Installation",
  "Remote Pairing Problem",
  "Glass Break",
  "General Service",
];

const CORRECTIVE_ACTION_OPTIONS = [
  "Service Done",
  "Installation Done",
  "PCB Changed",
  "Wiring Done",
  "Glass Changed",
];

const EMPTY = {
  targetStatus: "",
  holdSubStatus: "",
  holdReason: "",
  holdPhotos: [],
  holdRemarks: "",
  actualIssueFound: "",
  correctiveActionTaken: "",
  consumedParts: [], // NEW — [{ sparePart, spareName, quantity, remarks }]
  closurePhotos: [],
  customerSignature: "",
  otp: "",
};

export default function UpdateJobStatusModal({ open, job, onClose, onHold, onComplete }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(EMPTY);
    setError("");
    onClose?.();
  }

  async function handleSubmit() {
    setError("");

    if (form.targetStatus === "Hold") {
      if (!form.holdSubStatus) return setError("Select a hold reason category.");
      if (form.holdPhotos.length < 2 || form.holdPhotos.length > 5) {
        return setError("Attach between 2 and 5 photos for a hold.");
      }
      setSubmitting(true);
      try {
        await onHold(job._id, {
          holdSubStatus: form.holdSubStatus,
          holdReason: form.holdReason,
          holdPhotos: form.holdPhotos,
          holdRemarks: form.holdRemarks,
        });
        handleClose();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to put job on hold.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (form.targetStatus === "Completed") {
      if (!form.actualIssueFound || !form.correctiveActionTaken) {
        return setError("Select the issue found and the action taken.");
      }
      if (!form.customerSignature) return setError("Customer signature is required.");
      if (!form.otp) return setError("Enter the OTP sent to the customer.");
      setSubmitting(true);
      try {
        await onComplete(job._id, {
          actualIssueFound: form.actualIssueFound,
          correctiveActionTaken: form.correctiveActionTaken,
          consumedParts: form.consumedParts.map(({ sparePart, quantity, remarks }) => ({
            sparePart,
            quantity,
            remarks,
          })), // strip spareName — it's UI-display-only, backend doesn't need it
          closurePhotos: form.closurePhotos,
          customerSignature: form.customerSignature,
          otp: form.otp,
        });
        handleClose();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to close job.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setError("Select what you want to do with this job.");
  }

  if (!job) return null;

  return (
    <Modal open={open} title={`Update Status — ${job.complaintNumber ?? job._id}`}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">Action</label>
          <select
            value={form.targetStatus}
            onChange={(e) => update("targetStatus", e.target.value)}
            className={inputClass}>
            <option value="">Select an action</option>
            <option value="Hold">Put on Hold</option>
            <option value="Completed">Mark Completed</option>
          </select>
        </div>

        {form.targetStatus === "Hold" && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">Hold Reason Category</label>
              <select
                required
                value={form.holdSubStatus}
                onChange={(e) => update("holdSubStatus", e.target.value)}
                className={inputClass}>
                <option value="">Select reason</option>
                {HOLD_SUB_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">Reason (notes)</label>
              <textarea rows={2} value={form.holdReason} onChange={(e) => update("holdReason", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">Remarks</label>
              <textarea rows={2} value={form.holdRemarks} onChange={(e) => update("holdRemarks", e.target.value)} className={inputClass} />
            </div>
            <UploadImage
              label="Photos (2–5 required)"
              multiple
              min={2}
              max={5}
              value={form.holdPhotos}
              onChange={(urls) => update("holdPhotos", urls)}
            />
          </>
        )}

        {form.targetStatus === "Completed" && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">Actual Issue Found</label>
              <select
                required
                value={form.actualIssueFound}
                onChange={(e) => update("actualIssueFound", e.target.value)}
                className={inputClass}>
                <option value="">Select issue</option>
                {ACTUAL_ISSUE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">Corrective Action Taken</label>
              <select
                required
                value={form.correctiveActionTaken}
                onChange={(e) => update("correctiveActionTaken", e.target.value)}
                className={inputClass}>
                <option value="">Select action</option>
                {CORRECTIVE_ACTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <SparePartsPicker
              value={form.consumedParts}
              onChange={(parts) => update("consumedParts", parts)}
            />

            <UploadImage
              label="Closure Photos"
              multiple
              min={0}
              max={8}
              value={form.closurePhotos}
              onChange={(urls) => update("closurePhotos", urls)}
            />
            <UploadImage
              label="Customer Signature"
              value={form.customerSignature}
              onChange={(url) => update("customerSignature", url)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">OTP (from customer)</label>
              <input required value={form.otp} onChange={(e) => update("otp", e.target.value)} className={inputClass} />
            </div>
          </>
        )}

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}