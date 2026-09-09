"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_VALUES = {
  companyName: "",
  address: "",
  contactPerson: "",
  contactNumber: "",
  gstNumber: "",
  username: "",
  password: "",
  creationDate: new Date().toISOString().slice(0, 10),
  subscriptionFrom: "",
  subscriptionTo: "",
  status: "Active",
};

// Normalizes any date-ish value (ISO string, Date object, "YYYY-MM-DD") into
// the exact "YYYY-MM-DD" shape <input type="date"> requires to show a value.
function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function CompanyForm({
  initialData,
  isEditMode = false,
  onSubmit,
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...DEFAULT_VALUES,
    ...initialData,
    // API returns these nested under subscriptionPlan.{fromDate,toDate} —
    // flatten + reformat into what the date inputs and handleSubmit expect.
    subscriptionFrom: toDateInputValue(initialData?.subscriptionPlan?.fromDate),
    subscriptionTo: toDateInputValue(initialData?.subscriptionPlan?.toDate),
    creationDate: initialData?.creationDate
      ? toDateInputValue(initialData.creationDate)
      : DEFAULT_VALUES.creationDate,
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      onSubmit(form);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Company Details
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Company Name" required>
            <input
              name="companyName"
              required
              value={form.companyName}
              onChange={handleChange}
              className="input"
              placeholder="Orion Electronics Pvt Ltd"
            />
          </Field>
          <Field label="GST Number" required>
            <input
              name="gstNumber"
              required
              value={form.gstNumber}
              onChange={handleChange}
              className="input"
              placeholder="29AAACO1234F1Z5"
            />
          </Field>
          <Field label="Contact Person" required>
            <input
              name="contactPerson"
              required
              value={form.contactPerson}
              onChange={handleChange}
              className="input"
            />
          </Field>
          <Field label="Contact Number" required>
            <input
              name="contactNumber"
              type="tel"
              required
              value={form.contactNumber}
              onChange={handleChange}
              className="input"
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Address" required>
            <textarea
              name="address"
              required
              rows={2}
              value={form.address}
              onChange={handleChange}
              className="input resize-none"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Login Credentials
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Username" required>
            <input
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="input"
            />
          </Field>
          <Field
            label="Password"
            required={!isEditMode}
            hint={
              isEditMode
                ? "Leave blank to keep the current password"
                : undefined
            }>
            <input
              name="password"
              type="password"
              required={!isEditMode}
              value={form.password}
              onChange={handleChange}
              className="input"
              placeholder={isEditMode ? "••••••••" : ""}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Subscription & Status
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Subscription From" required>
            <input
              name="subscriptionFrom"
              type="date"
              required
              value={form.subscriptionFrom}
              onChange={handleChange}
              className="input"
            />
          </Field>
          <Field label="Subscription To" required>
            <input
              name="subscriptionTo"
              type="date"
              required
              value={form.subscriptionTo}
              onChange={handleChange}
              className="input"
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/companies")}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110 disabled:opacity-70">
          {isSaving && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {isEditMode ? "Save Changes" : "Create Company"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #0b1220;
          outline: none;
          transition:
            box-shadow 0.15s,
            border-color 0.15s;
        }
        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }
        .input:disabled {
          background: #f8fafc;
          color: #94a3b8;
        }
      `}</style>
    </form>
  );
}
