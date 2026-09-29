import * as XLSX from "xlsx";

/**
 * Exports an array of job objects to a downloadable .xlsx file.
 * Flattens the fields worth putting in a spreadsheet — not the raw Mongo
 * documents (nested customer/engineer objects, ObjectIds, etc. that mean
 * nothing in a spreadsheet cell).
 */
export function exportJobsToExcel(jobs = [], filename = "jobs") {
  const rows = jobs.map((job, idx) => ({
    "S.No.": idx + 1,
    "Complaint No.": job.complaintNumber || `SL${job._id?.slice(-5) ?? ""}`,
    Booked: job.complaintDate ? new Date(job.complaintDate).toLocaleString("en-IN") : "",
    Schedule: job.scheduleDate ? new Date(job.scheduleDate).toLocaleDateString("en-IN") : "",
    Solved: job.solveDate ? new Date(job.solveDate).toLocaleString("en-IN") : "",
    "Customer Name": job.customer?.name || "",
    "Customer Number": job.customer?.mobileNumber || "",
    Address: job.customer?.address || "",
    Brand: job.brand || "",
    Product: job.product || "",
    Model: job.modelNumber || "",
    "Serial Number": job.serialNumber || "",
    "Nature of Work": job.natureOfWork || "",
    "Call Type": job.callType || "",
    "Assigned Engineer": job.assignedServiceEngineer?.name || "",
    Status: job.status || "",
    "Hold Reason": job.holdReason || "",
    "Cancel Reason": job.cancelReason || "",
    "Approx Cost": job.approxCost ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
}