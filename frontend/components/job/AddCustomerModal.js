"use client";

import { useState } from "react";
import Modal from "./Modal";

const EMPTY_FORM = {
  name: "",
  mobileNumber: "",
  alternateNumber: "",
  address: "",
};

export default function AddCustomerModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    onClose?.();
  }

  async function handleSave() {
    if (!form.name || !form.mobileNumber) return;
    setSaving(true);
    try {
      await onSave?.(form); // parent's handleAddCustomer does the actual API call
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Add New Customer">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Customer Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-50 text-black px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Mobile Number
          </label>
          <input
            required
            value={form.mobileNumber}
            onChange={(e) => update("mobileNumber", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-50 text-black px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-900">
            Address
          </label>
          <textarea
            rows={3}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-50 text-black px-3 py-2 text-sm focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
            {saving ? "Saving…" : "Save Customer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
