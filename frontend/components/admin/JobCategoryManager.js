"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getJobCategories,
  createJobCategory,
  updateJobCategory,
  deleteJobCategory,
} from "@/actions/admin";

const TABS = [
  { type: "HoldSubStatus", label: "Hold Reason Categories" },
  { type: "ActualIssue", label: "Actual Issue Found" },
  { type: "CorrectiveAction", label: "Corrective Action Taken" },
  { type: "JobSource", label: "Job Source" },
  { type: "CallType", label: "Call Type" },
  { type: "NatureOfWork", label: "Nature of Work" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400";

export default function JobCategoryManager() {
  const [activeTab, setActiveTab] = useState(TABS[0].type);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");

  useEffect(() => {
    load();
  }, [activeTab]);

  async function load() {
    setLoading(true);

    try {
      const res = await getJobCategories(activeTab);
      setItems(res.data?.data ?? []);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;

    try {
      await createJobCategory({
        type: activeTab,
        label: newLabel.trim(),
      });

      setNewLabel("");
      toast.success("Added");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add");
    }
  }

  async function handleToggleActive(item) {
    try {
      await updateJobCategory(item._id, {
        isActive: !item.isActive,
      });

      load();
    } catch (err) {
      toast.error("Failed to update");
    }
  }

  async function handleSaveEdit(id) {
    if (!editingLabel.trim()) return;

    try {
      await updateJobCategory(id, {
        label: editingLabel.trim(),
      });

      setEditingId(null);
      setEditingLabel("");
      toast.success("Updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category? This cannot be undone.")) return;

    try {
      await deleteJobCategory(id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
      {/* Tabs */}
      <div className="mb-4 -mx-1 overflow-x-auto border-b border-slate-200 px-1">
        <div className="flex min-w-max gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActiveTab(tab.type)}
              className={`whitespace-nowrap px-3 py-2.5 text-sm font-medium transition ${
                activeTab === tab.type
                  ? "border-b-2 border-electric-500 text-electric-500"
                  : "text-slate-500 hover:text-navy-900"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Category */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New category label"
          className={inputClass}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAdd();
            }
          }}
        />

        <button
          type="button"
          onClick={handleAdd}
          className="w-full whitespace-nowrap rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto">
          Add
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No categories yet.</p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Label / Edit Input */}
              <div className="min-w-0 flex-1">
                {editingId === item._id ? (
                  <input
                    autoFocus
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit(item._id);
                      }

                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingLabel("");
                      }
                    }}
                    className={inputClass}
                  />
                ) : (
                  <span
                    className={`block whitespace-nowrap text-sm ${
                      item.isActive
                        ? "text-navy-900"
                        : "text-slate-400 line-through"
                    }`}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
                {editingId === item._id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item._id)}
                      className="whitespace-nowrap text-xs font-semibold text-electric-500 hover:text-electric-600">
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingLabel("");
                      }}
                      className="whitespace-nowrap text-xs font-semibold text-slate-500 hover:text-navy-900">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item._id);
                      setEditingLabel(item.label);
                    }}
                    className="whitespace-nowrap text-xs font-semibold text-slate-500 hover:text-navy-900">
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  className="whitespace-nowrap text-xs font-semibold text-slate-500 hover:text-navy-900">
                  {item.isActive ? "Deactivate" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  className="whitespace-nowrap text-xs font-semibold text-red-500 hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
