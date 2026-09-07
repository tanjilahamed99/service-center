"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "@/actions/admin";

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 disabled:text-slate-400";

function StatusBadge({ status }) {
  const tone =
    status === "Active"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
      : "bg-red-50 text-red-500 ring-red-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tone}`}>
      {status}
    </span>
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function CompanyProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await getProfile();
        const data = res?.data?.data;

        setProfile(data);
        setForm({
          name: data?.name ?? "",
          phone: data?.phone ?? "",
          email: data?.email ?? "",
          address: data?.address ?? "",
        });
      } catch (error) {
        console.error("Failed to load profile", error);
        setLoadError(
          error?.response?.data?.message || "Failed to load your profile.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePasswordField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    try {
      setIsSavingProfile(true);
      const res = await updateProfile(form);
      setProfile(res?.data?.data ?? { ...profile, ...form });
      setProfileSuccess("Profile updated.");
    } catch (error) {
      console.error("Failed to update profile", error);
      setProfileError(
        error?.response?.data?.message ||
          "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    try {
      setIsSavingPassword(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password updated.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to change password", error);
      setPasswordError(
        error?.response?.data?.message ||
          "Failed to change password. Please try again.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">
        Loading your profile…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-12 text-center text-sm text-red-600">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white">
          {initials(profile?.name) || "SE"}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-navy-900">
            {profile?.name || "User"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {/* <span className="text-slate-300">·</span> */}
            <StatusBadge status={profile?.status ?? "Active"} />
          </div>
        </div>
      </div>

      {/* Profile information */}
      <form onSubmit={handleProfileSubmit}>
        <SectionCard
          title="Profile Information"
          subtitle="Update your name and contact details.">
          {profileError && (
            <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
              {profileSuccess}
            </div>
          )}

          <Field label="Company Name" className="">
            <input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email Address">
            <input
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass}
              disabled
            />
          </Field>
          <Field label="Contact Number">
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass}
              type="number"
            />
          </Field>
          <Field label="Address">
            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-lg bg-linear-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110 disabled:opacity-60">
              {isSavingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </SectionCard>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordSubmit}>
        <SectionCard
          title="Change Password"
          subtitle="Choose a new password for your account.">
          {passwordError && (
            <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
              {passwordSuccess}
            </div>
          )}

          <Field label="Current Password" className="sm:col-span-2">
            <input
              required
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                updatePasswordField("currentPassword", e.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="New Password">
            <input
              required
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                updatePasswordField("newPassword", e.target.value)
              }
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm New Password">
            <input
              required
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                updatePasswordField("confirmPassword", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="rounded-lg border border-electric-400/40 bg-electric-500/10 px-5 py-2.5 text-sm font-semibold text-electric-500 hover:bg-electric-500/15 disabled:opacity-60">
              {isSavingPassword ? "Updating…" : "Update Password"}
            </button>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
