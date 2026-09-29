"use client";

import { Download } from "lucide-react";
import { exportJobsToExcel } from "@/utils/exportJobsToExcel";

export default function DownloadExcelButton({ jobs, filename = "jobs", label = "Download" }) {
  return (
    <button
      type="button"
      onClick={() => exportJobsToExcel(jobs, filename)}
      disabled={!jobs?.length}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}