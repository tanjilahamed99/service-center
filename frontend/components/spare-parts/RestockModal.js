// components/spare-parts/RestockModal.jsx
"use client";

import { useState } from "react";
import Modal from "../job/Modal";
import { restockSparePart } from "@/actions/company";

export default function RestockModal({ open, sparePart, onClose, onDone }) {
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setQuantity("");
    setNote("");
    setError("");
    onClose?.();
  }

  async function handleSubmit() {
    if (!quantity || Number(quantity) <= 0) return setError("Enter a quantity greater than 0.");
    setSubmitting(true);
    setError("");
    try {
      await restockSparePart(sparePart._id, { quantity: Number(quantity), note });
      onDone?.();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restock.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sparePart) return null;

  return (
    <Modal open={open} title={`Restock — ${sparePart.spareName}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Currently {sparePart.companyStock} {sparePart.unit} in the central store.</p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">Quantity to add</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">Note (optional)</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400" />
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {submitting ? "Saving…" : "Restock"}
          </button>
        </div>
      </div>
    </Modal>
  );
}