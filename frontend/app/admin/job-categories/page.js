// app/company/settings/job-categories/page.jsx
"use client";

import JobCategoryManager from "@/components/admin/JobCategoryManager";

export default function JobCategoriesSettingsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-navy-900">Job Categories</h2>
        <p className="text-sm text-slate-500">
          Manage the dropdown options service engineers see when putting a job
          on hold or marking it complete.
        </p>
      </div>

      <JobCategoryManager />
    </div>
  );
}
