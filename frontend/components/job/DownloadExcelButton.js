"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportJobsToExcel } from "@/utils/exportJobsToExcel";

export default function DownloadExcelButton({
  jobs,
  filename = "jobs",
  label = "Download",
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!jobs?.length || loading) return;

    setLoading(true);
    try {
      await exportJobsToExcel(jobs, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!jobs?.length || loading}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
      ) : (
        <Download className="h-4 w-4" strokeWidth={1.75} />
      )}

      {label}
    </button>
  );
}