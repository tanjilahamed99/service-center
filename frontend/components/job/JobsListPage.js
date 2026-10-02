"use client";

import { useEffect, useState, useCallback } from "react";
import { JOB_STATUS } from "./Constants";
import JobsTable from "./Jobstable";
import AssignJobModal from "./Assignjobmodal";
import CancelJobModal from "./Canceljobmodal";
import ViewLogsModal from "./Viewlogsmodal";
import ViewImagesModal from "./ViewImagesModal";
import Pagination from "@/components/Pagination";
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
};

const PAGE_SIZE = 20; // matches your backend's default `limit`

export default function JobsListPage({ variant, title, subtitle }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [serviceCenters, setServiceCenters] = useState([]);
  const [serviceEngineers, setServiceEngineers] = useState([]);

  const [assignTarget, setAssignTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [logsTarget, setLogsTarget] = useState(null);
  const [imagesTarget, setImagesTarget] = useState(null);

  const fetchJobs = useCallback(
    async (targetPage = page, extraParams = {}) => {
      setLoading(true);
      setError("");
      try {
        const status = VARIANT_STATUS_FILTER[variant];
        const res = await getJobs({
          ...(status ? { status } : {}),
          page: targetPage,
          limit: PAGE_SIZE,
          ...extraParams,
        });
        setJobs(res.data?.data ?? []);
        setPagination(res.data?.pagination ?? { total: 0, pages: 1 });
      } catch (err) {
        console.error("Failed to load jobs", err);
        setError("Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [variant, page],
  );

  // Reset to page 1 whenever the variant (status tab) changes — staying on
  // page 5 of "All Jobs" while switching to "Completed" would silently show
  // an empty/wrong page otherwise.
  useEffect(() => {
    setPage(1);
  }, [variant]);

  useEffect(() => {
    fetchJobs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, page]);

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
      await fetchJobs(page);
    } catch (err) {
      console.error("Failed to assign job(s)", err);
    }
  }

  async function handleCancel({ jobId, reason }) {
    try {
      await cancelJob(jobId, { reason });
      setCancelTarget(null);
      await fetchJobs(page);
    } catch (err) {
      console.error("Failed to cancel job", err);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading jobs…</p>;
  }

  return (
    <>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}

      <JobsTable
        title={title}
        subtitle={subtitle}
        jobs={jobs}
        variant={variant}
        serviceCenterOptions={serviceCenters}
        serviceEngineerOptions={serviceEngineers}
        onEditJob={(job) => console.log("Edit", job._id)}
        onAssignJob={(jobIds) => setAssignTarget(jobIds)}
        onViewLogs={(job) => setLogsTarget(job)}
        onCancelJob={(job) => setCancelTarget(job)}
        onViewImages={(job) => setImagesTarget(job)}
      />

      <Pagination
        page={page}
        totalPages={pagination.pages}
        totalItems={pagination.total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <AssignJobModal
        open={!!assignTarget}
        jobIds={assignTarget ?? []}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
        serviceCenterOptions={serviceCenters}
      />
      <CancelJobModal
        open={!!cancelTarget}
        job={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelJob={handleCancel}
      />
      <ViewLogsModal open={!!logsTarget} job={logsTarget} onClose={() => setLogsTarget(null)} />
      <ViewImagesModal open={!!imagesTarget} job={imagesTarget} onClose={() => setImagesTarget(null)} />
    </>
  );
}