// components/service-engineer/SparePartsPicker.jsx
"use client";

import { useEffect, useState } from "react";
import { serviceEngineerGetMySparePartStock } from "@/actions/service-engineer";

/**
 * Lets the engineer pick parts (and quantities) they actually have on hand,
 * capped at each part's available stock. `value` is an array of
 * { sparePart, spareName, quantity, remarks } — matches Job.consumedParts.
 */
export default function SparePartsPicker({ value = [], onChange }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingPartId, setPendingPartId] = useState("");
  const [pendingQty, setPendingQty] = useState("");

  useEffect(() => {
    serviceEngineerGetMySparePartStock()
      .then((res) => setStock(res.data?.data ?? []))
      .catch((err) => {
        console.error("Failed to load spare part stock", err);
        setError("Couldn't load your center's spare parts.");
      })
      .finally(() => setLoading(false));
  }, []);

  function availableFor(sparePartId) {
    const row = stock.find((s) => s.sparePart._id === sparePartId);
    if (!row) return 0;
    const alreadyPicked = value.find((v) => v.sparePart === sparePartId)?.quantity ?? 0;
    return row.quantity - alreadyPicked;
  }

  function handleAdd() {
    if (!pendingPartId) return;
    const qty = Number(pendingQty);
    if (!qty || qty <= 0) return;

    const row = stock.find((s) => s.sparePart._id === pendingPartId);
    if (!row) return;

    const existing = value.find((v) => v.sparePart === pendingPartId);
    const nextQty = (existing?.quantity ?? 0) + qty;
    if (nextQty > row.quantity) {
      // Cap silently at what's actually on hand rather than erroring —
      // simplest UX for a quick in-field form.
      return;
    }

    if (existing) {
      onChange(value.map((v) => (v.sparePart === pendingPartId ? { ...v, quantity: nextQty } : v)));
    } else {
      onChange([
        ...value,
        {
          sparePart: pendingPartId,
          spareName: row.sparePart.spareName,
          quantity: qty,
          remarks: "",
        },
      ]);
    }
    setPendingPartId("");
    setPendingQty("");
  }

  function handleRemove(sparePartId) {
    onChange(value.filter((v) => v.sparePart !== sparePartId));
  }

  function handleQtyChange(sparePartId, qty) {
    const row = stock.find((s) => s.sparePart._id === sparePartId);
    const capped = Math.min(Number(qty) || 0, row?.quantity ?? 0);
    onChange(value.map((v) => (v.sparePart === sparePartId ? { ...v, quantity: capped } : v)));
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy-900">Spare Parts Used (optional)</label>

      {loading ? (
        <p className="text-xs text-slate-400">Loading your center's stock…</p>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : stock.length === 0 ? (
        <p className="text-xs text-slate-400">No spare parts allocated to your center yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={pendingPartId}
              onChange={(e) => setPendingPartId(e.target.value)}
              className={`${inputClass} sm:flex-1`}>
              <option value="">Select a spare part</option>
              {stock.map((s) => (
                <option key={s.sparePart._id} value={s.sparePart._id} disabled={availableFor(s.sparePart._id) <= 0}>
                  {s.sparePart.spareName} ({s.sparePart.brand} / {s.sparePart.product}) — {availableFor(s.sparePart._id)} {s.sparePart.unit} available
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={pendingQty}
              onChange={(e) => setPendingQty(e.target.value)}
              className={`${inputClass} sm:w-24`}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!pendingPartId || !pendingQty}
              className="rounded-lg border border-electric-400/40 bg-electric-500/10 px-4 py-2 text-sm font-semibold text-electric-500 hover:bg-electric-500/15 disabled:opacity-50">
              Add
            </button>
          </div>

          {value.length > 0 && (
            <div className="mt-3 space-y-2">
              {value.map((v) => (
                <div key={v.sparePart} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm text-navy-900">{v.spareName}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={v.quantity}
                      onChange={(e) => handleQtyChange(v.sparePart, e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-navy-900 focus:border-electric-400 focus:outline-none focus:ring-1 focus:ring-electric-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(v.sparePart)}
                      className="text-xs font-semibold text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}