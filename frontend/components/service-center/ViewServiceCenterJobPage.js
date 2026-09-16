"use client";

import { useEffect, useState, useCallback } from "react";
import {
  serviceCenterJobs,
  assignJob,
  holdJob,
  cancelJob,
  updateJobStatus,
  getServiceEngineers,
  getServiceCenterJobDataByStatus,
} from "@/actions/service-center";
import { JOB_STATUS } from "../job/Constants";
import ViewLogsModal from "../job/Viewlogsmodal";
import ServiceCenterJobsTable from "./ServiceCenterJobTable";

const VARIANT_STATUS_FILTER = {
  registered: JOB_STATUS.REGISTERED,
  serviceCenter: JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  serviceEngineer: JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  hold: JOB_STATUS.HOLD,
  completed: JOB_STATUS.COMPLETED,
  cancelled: JOB_STATUS.CANCELLED,
  // "all" has no entry — no status param is sent, and the page's own
  // Status dropdown (if present) can pass a status through instead.
};

export default function ViewServiceCenterJobPage({ title, subtitle, status }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceEngineers, setServiceEngineers] = useState([]);
  const [logsTarget, setLogsTarget] = useState(null); // single job

  const fetchJobs = useCallback(
    async (extraParams = {}) => {
      setLoading(true);
      setError("");
      try {
        const res = await getServiceCenterJobDataByStatus({ status });
        setJobs(res.data?.data ?? []);
      } catch (err) {
        console.error("Failed to load jobs", err);
        setError("Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    getServiceEngineers()
      .then((res) => setServiceEngineers(res.data?.data ?? []))
      .catch((err) => console.error("Failed to load service engineers", err));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading jobs…</p>;
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm font-medium text-red-500">{error}</p>
      )}

      <ServiceCenterJobsTable
        title={title}
        subtitle={subtitle}
        jobs={jobs}
        variant={status}
        serviceEngineerOptions={serviceEngineers}
        hideActions={true}
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
