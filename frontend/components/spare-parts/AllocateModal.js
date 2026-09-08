// components/spare-parts/AllocateModal.jsx
"use client";

import { useEffect, useState } from "react";
import Modal from "../job/Modal";
import { allocateSparePart, getServiceCenters } from "@/actions/company";

export default function AllocateModal({ open, sparePart, onClose, onDone }) {
  const [centers, setCenters] = useState([]);
  const [serviceCenter, setServiceCenter] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      getServiceCenters({ status: "Active" })
        .then((res) => setCenters(res.data?.data ?? []))
        .catch((err) => console.error("Failed to load service centers", err));
    }
  }, [open]);

  function handleClose() {
    setServiceCenter("");
    setQuantity("");
    setNote("");
    setError("");
    onClose?.();
  }

  async function handleSubmit() {
    if (!serviceCenter) return setError("Select a service center.");
    if (!quantity || Number(quantity) <= 0)
      return setError("Enter a quantity greater than 0.");
    setSubmitting(true);
    setError("");
    try {
      await allocateSparePart(sparePart._id, {
        serviceCenter,
        quantity: Number(quantity),
        note,
      });
      onDone?.();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to allocate.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sparePart) return null;

  return (
    <Modal open={open} title={`Allocate — ${sparePart.spareName}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          {sparePart.companyStock} {sparePart.unit} available in the central
          store.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Service Center
          </label>
          <select
            required
            value={serviceCenter}
            onChange={(e) => setServiceCenter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400">
            <option value="">Select service center</option>
            {centers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max={sparePart.companyStock}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
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
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {submitting ? "Saving…" : "Allocate"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
