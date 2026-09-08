// app/company/spare-parts/new/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSparePart } from "@/actions/company";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400";

const EMPTY = {
  brand: "",
  product: "",
  modelNumber: "",
  spareName: "",
  category: "",
  unit: "pcs",
  initialQuantity: "",
};

export default function NewSparePartPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createSparePart({
        ...form,
        initialQuantity: Number(form.initialQuantity) || 0,
      });
      router.push("/company/spare-parts");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create spare part.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">Add Spare Part</h2>
        <p className="mt-1 text-sm text-slate-500">
          Adds to your central store. Allocate to a service center afterward.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-10">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Brand
              </label>
              <input
                required
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Product
              </label>
              <input
                required
                value={form.product}
                onChange={(e) => update("product", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Model Number
              </label>
              <input
                value={form.modelNumber}
                onChange={(e) => update("modelNumber", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Spare Name
              </label>
              <input
                required
                value={form.spareName}
                onChange={(e) => update("spareName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Unit
              </label>
              <input
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
                className={inputClass}
                placeholder="pcs, kg, etc."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Initial Stock (central store)
              </label>
              <input
                type="number"
                min="0"
                value={form.initialQuantity}
                onChange={(e) => update("initialQuantity", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110 disabled:opacity-60">
            {submitting ? "Saving…" : "Create Spare Part"}
          </button>
        </div>
      </form>
    </div>
  );
}
