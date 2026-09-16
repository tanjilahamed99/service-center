"use client";

import { useCallback, useEffect, useState } from "react";
import { myJobs } from "@/actions/service-engineer";
import JobsTable from "@/components/job/Jobstable";
import ViewLogsModal from "@/components/job/Viewlogsmodal";
import ServiceEngineerJobsListPage from "./ServiceCenterJobsListPage";
import ServiceEngineerJobsTable from "./ServiceEngineerJobTable";

const TERMINAL_STATUSES = ["Completed", "Cancelled"];

/**
 * statusMode: "pending" | "completed"
 * "pending" = every job assigned to this engineer that hasn't reached a
 * terminal status yet (Registered/Assigned/Hold — whatever isn't done).
 */
export default function EngineerJobsListPage({ statusMode, title, subtitle }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logsTarget, setLogsTarget] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { status: statusMode };
      const res = await myJobs(params);
      let data = res.data?.data ?? [];
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs", err);
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [statusMode]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading jobs…</p>;
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm font-medium text-red-500">{error}</p>
      )}

      <ServiceEngineerJobsTable
        title={title}
        subtitle={subtitle}
        jobs={jobs}
        variant="serviceEngineer" // no Assign/Cancel actions for this role — those buttons only render for "registered"/"serviceCenter"
        onViewLogs={(job) => setLogsTarget(job)}
      />

      <ViewLogsModal
        open={!!logsTarget}
        job={logsTarget}
        onClose={() => setLogsTarget(null)}
      />
    </>
  );
}
