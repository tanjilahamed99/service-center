"use client";

import { useEffect, useState, useCallback } from "react";
import {
  serviceCenterJobs,
  assignJob,
  holdJob,
  cancelJob,
  updateJobStatus,
  getServiceEngineers,
} from "@/actions/service-center";
import { JOB_STATUS } from "../job/Constants";
import ViewLogsModal from "../job/Viewlogsmodal";
import ServiceCenterJobsTable from "./ServiceCenterJobTable";
import ServiceCenterAssignJobModal from "./ServiceCenterAssignModal";
import ServiceCenterCancelJobModal from "./ServiceCenterCancelJobModal";
import HoldJobModal from "./HoldModal";
import ServiceCenterUpdateStatusModal from "./ServiceCenterUpdateStatusModal";

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

export default function ServiceJobsListPage({ variant, title, subtitle }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceEngineers, setServiceEngineers] = useState([]);

  const [assignTarget, setAssignTarget] = useState(null); // array of job ids
  const [holdTarget, setHoldTarget] = useState(null); // single job
  const [cancelTarget, setCancelTarget] = useState(null); // single job
  const [logsTarget, setLogsTarget] = useState(null); // single job
  const [editTarget, setEditTarget] = useState(null); // single job — status-only edit

  const fetchJobs = useCallback(
    async (extraParams = {}) => {
      setLoading(true);
      setError("");
      try {
        const status = VARIANT_STATUS_FILTER[variant];
        const res = await serviceCenterJobs({
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
    // Engineers belonging to this service center only — used for the
    // Assign modal's dropdown.
    getServiceEngineers()
      .then((res) => setServiceEngineers(res.data?.data ?? []))
      .catch((err) => console.error("Failed to load service engineers", err));
  }, []);

  async function handleAssign({ jobIds, serviceEngineer, scheduleDate, note }) {
    try {
      const { data } = await assignJob({
        jobIds,
        serviceEngineer,
        scheduleDate,
        note,
      });
      console.log(data);
      setAssignTarget(null);
      await fetchJobs(); // simplest correct option: just re-pull from the server
    } catch (err) {
      console.error("Failed to assign job(s)", err);
      // TODO: surface this in the modal instead of silently closing, if it supports an error prop
    }
  }

  async function handleHold({
    jobId,
    holdSubStatus,
    holdReason,
    holdPhotos,
    holdRemarks,
  }) {
    try {
      await holdJob(jobId, {
        holdSubStatus,
        holdReason,
        holdPhotos,
        holdRemarks,
      });
      setHoldTarget(null);
      await fetchJobs();
    } catch (err) {
      console.error("Failed to hold job", err);
    }
  }

  async function handleUpdateStatus({ jobId, status, note }) {
    try {
      await updateJobStatus(jobId, { status, note });
      setEditTarget(null);
      await fetchJobs();
    } catch (err) {
      console.error("Failed to update status", err);
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

      <ServiceCenterJobsTable
        title={title}
        subtitle={subtitle}
        jobs={jobs}
        variant={variant}
        serviceEngineerOptions={serviceEngineers}
        onEditJob={(job) => setEditTarget(job)}
        onAssignJob={(jobIds) => setAssignTarget(jobIds)}
        onHoldJob={(job) => setHoldTarget(job)}
        onViewLogs={(job) => setLogsTarget(job)}
        onCancelJob={(job) => setCancelTarget(job)}
      />

      <ServiceCenterAssignJobModal
        open={!!assignTarget}
        jobIds={assignTarget ?? []}
        serviceEngineerOptions={serviceEngineers}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
      />

      <ServiceCenterUpdateStatusModal
        open={!!editTarget}
        job={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <HoldJobModal
        open={!!holdTarget}
        job={holdTarget}
        onClose={() => setHoldTarget(null)}
        onHold={handleHold}
      />

      <ViewLogsModal
        open={!!logsTarget}
        job={logsTarget}
        onClose={() => setLogsTarget(null)}
      />
    </>
  );
}
