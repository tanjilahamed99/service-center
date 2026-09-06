"use client";

import { useEffect, useState, useCallback } from "react";
import { JOB_STATUS } from "../job/Constants";
import ViewLogsModal from "../job/Viewlogsmodal";
import UpdateJobStatusModal from "./UpdateJobStatusModal";
import {
  serviceEngineerJobs,
  serviceEngineerHoldJob,
  serviceEngineerCloseJob,
} from "@/actions/service-engineer";
import ServiceEngineerJobsTable from "./ServiceEngineerJobTable";

const VARIANT_STATUS_FILTER = {
  registered: JOB_STATUS.REGISTERED,
  serviceCenter: JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  serviceEngineer: JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  hold: JOB_STATUS.HOLD,
  completed: JOB_STATUS.COMPLETED,
  cancelled: JOB_STATUS.CANCELLED,
};

export default function ServiceEngineerJobsListPage({
  variant,
  title,
  subtitle,
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [logsTarget, setLogsTarget] = useState(null); // single job (view)
  const [statusTarget, setStatusTarget] = useState(null); // single job (update status)

  console.log(jobs);

  const fetchJobs = useCallback(
    async (extraParams = {}) => {
      setLoading(true);
      setError("");
      try {
        const status = VARIANT_STATUS_FILTER[variant];
        const res = await serviceEngineerJobs({
          ...(status ? { status } : {}),
          ...extraParams,
        });
        setJobs(res.data?.data ?? []);
      } catch (err) {
        console.error("Failed to load jobs", err);
        setError("Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [variant],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleHold(jobId, payload) {
    await serviceEngineerHoldJob(jobId, payload);
    await fetchJobs();
  }

  async function handleComplete(jobId, payload) {
    await serviceEngineerCloseJob(jobId, payload);
    await fetchJobs();
  }

  if (loading) return <p className="text-sm text-slate-400">Loading jobs…</p>;

  return (
    <>
      {error && (
        <p className="mb-4 text-sm font-medium text-red-500">{error}</p>
      )}

      <ServiceEngineerJobsTable
        title={title}
        subtitle={subtitle}
        jobs={jobs}
        onViewJob={(job) => setLogsTarget(job)}
        onUpdateStatus={(job) => setStatusTarget(job)}
      />

      <ViewLogsModal
        open={!!logsTarget}
        job={logsTarget}
        onClose={() => setLogsTarget(null)}
      />

      <UpdateJobStatusModal
        open={!!statusTarget}
        job={statusTarget}
        onClose={() => setStatusTarget(null)}
        onHold={handleHold}
        onComplete={handleComplete}
      />
    </>
  );
}
