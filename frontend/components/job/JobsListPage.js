"use client";

import { useEffect, useState, useCallback } from "react";
import { JOB_STATUS } from "./Constants";
import JobsTable from "./Jobstable";
import AssignJobModal from "./Assignjobmodal";
import CancelJobModal from "./Canceljobmodal";
import ViewLogsModal from "./Viewlogsmodal";
import {
  getJobs,
  assignJob,
  cancelJob,
  getServiceCenters,
  getServiceEngineers,
} from "@/actions/company";

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

export default function JobsListPage({ variant, title, subtitle }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceCenters, setServiceCenters] = useState([]);
  const [serviceEngineers, setServiceEngineers] = useState([]);

  const [assignTarget, setAssignTarget] = useState(null); // array of job ids
  const [cancelTarget, setCancelTarget] = useState(null); // single job
  const [logsTarget, setLogsTarget] = useState(null); // single job

  const fetchJobs = useCallback(
    async (extraParams = {}) => {
      setLoading(true);
      setError("");
      try {
        const status = VARIANT_STATUS_FILTER[variant];
        const res = await getJobs({
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

  useEffect(() => {
    getServiceCenters()
      .then((res) => setServiceCenters(res.data?.data ?? []))
      .catch((err) => console.error("Failed to load service centers", err));
    getServiceEngineers()
      .then((res) => setServiceEngineers(res.data?.data ?? []))
      .catch((err) => console.error("Failed to load service engineers", err));
  }, []);

  async function handleAssign({ jobIds, serviceCenter, scheduleDate, note }) {
    try {
      await assignJob({ jobIds, serviceCenter, scheduleDate, note });
      setAssignTarget(null);
      await fetchJobs(); // simplest correct option: just re-pull from the server
    } catch (err) {
      console.error("Failed to assign job(s)", err);
      // surface this in the modal instead of silently closing, if it supports an error prop
    }
  }

  async function handleCancel({ jobId, reason }) {
    try {
      await cancelJob(jobId, { reason });
      setCancelTarget(null);
      await fetchJobs();
    } catch (err) {
      console.error("Failed to cancel job", err);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading jobs…</p>;
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm font-medium text-red-500">{error}</p>
      )}

      <JobsTable
        title={title}
        subtitle={subtitle}
        jobs={jobs}
        variant={variant}
        // These now carry {_id, name} objects — AssignJobModal needs to submit
        // the _id as `serviceCenter`, not the display name, since the backend
        // expects an ObjectId.
        serviceCenterOptions={serviceCenters}
        serviceEngineerOptions={serviceEngineers}
        onEditJob={(job) => console.log("Edit", job._id)}
        onAssignJob={(jobIds) => setAssignTarget(jobIds)}
        onViewLogs={(job) => setLogsTarget(job)}
        onCancelJob={(job) => setCancelTarget(job)}
      />

      <AssignJobModal
        open={!!assignTarget}
        jobIds={assignTarget ?? []}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
        serviceCenterOptions={serviceCenters} // NEW
      />

      <CancelJobModal
        open={!!cancelTarget}
        job={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelJob={handleCancel}
      />

      <ViewLogsModal
        open={!!logsTarget}
        job={logsTarget}
        onClose={() => setLogsTarget(null)}
      />
    </>
  );
}
