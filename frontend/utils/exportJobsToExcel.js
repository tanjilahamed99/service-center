/**
 * Export jobs to a professionally styled .xlsx file (browser).
 * Requires:  npm i exceljs
 */

const COLORS = {
  navy: "FF1E293B",
  navyLight: "FF334155",
  white: "FFFFFFFF",
  zebra: "FFF8FAFC",
  border: "FFE2E8F0",
  text: "FF0F172A",
  muted: "FF64748B",
};

// Status badge colors (bg / font)
function statusStyle(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("complet") || s.includes("solved") || s.includes("closed"))
    return { bg: "FFDCFCE7", fg: "FF166534" }; // green
  if (s.includes("cancel"))
    return { bg: "FFFEE2E2", fg: "FF991B1B" }; // red
  if (s.includes("hold"))
    return { bg: "FFFEF3C7", fg: "FF92400E" }; // amber
  if (s.includes("assign") || s.includes("progress"))
    return { bg: "FFDBEAFE", fg: "FF1E40AF" }; // blue
  return { bg: "FFF1F5F9", fg: "FF475569" }; // gray
}

// ExcelJS stores dates as UTC; shift so Excel shows the user's local time.
function toExcelDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
}

const DATETIME_FMT = "dd-mmm-yyyy, hh:mm AM/PM";
const DATE_FMT = "dd-mmm-yyyy";

const COLUMNS = [
  { header: "S.No.", key: "sno", width: 7, align: "center" },
  { header: "Complaint No.", key: "complaintNo", width: 16, align: "center" },
  { header: "Booked", key: "booked", width: 22, align: "center", numFmt: DATETIME_FMT },
  { header: "Schedule", key: "schedule", width: 14, align: "center", numFmt: DATE_FMT },
  { header: "Solved", key: "solved", width: 22, align: "center", numFmt: DATETIME_FMT },
  { header: "Customer Name", key: "customerName", width: 24 },
  { header: "Customer Number", key: "customerNumber", width: 18, align: "center" },
  { header: "Address", key: "address", width: 38, wrap: true },
  { header: "Brand", key: "brand", width: 14 },
  { header: "Product", key: "product", width: 20 },
  { header: "Model", key: "model", width: 18 },
  { header: "Serial Number", key: "serial", width: 20 },
  { header: "Nature of Work", key: "nature", width: 20 },
  { header: "Call Type", key: "callType", width: 16 },
  { header: "Assigned Engineer", key: "engineer", width: 22 },
  { header: "Status", key: "status", width: 22, align: "center" },
  { header: "Hold Reason", key: "holdReason", width: 24, wrap: true },
  { header: "Cancel Reason", key: "cancelReason", width: 24, wrap: true },
  { header: "Approx Cost", key: "cost", width: 15, align: "right", numFmt: '"₹" #,##0' },
];

const thinBorder = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

export async function exportJobsToExcel(jobs = [], filename = "jobs") {
  try {
    // Lazy-load so it doesn't bloat the initial bundle
    const ExcelJS = (await import("exceljs")).default;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Service Management";
    workbook.created = new Date();

    const ws = workbook.addWorksheet("Jobs", {
      views: [
        { state: "frozen", xSplit: 2, ySplit: 4, showGridLines: false },
      ],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: "4:4",
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      },
      headerFooter: { oddFooter: "&LJobs Report&RPage &P of &N" },
    });

    const colCount = COLUMNS.length;
    ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

    // ---------- Title banner ----------
    ws.mergeCells(1, 1, 1, colCount);
    const title = ws.getCell(1, 1);
    title.value = "Service Jobs Report";
    title.font = { name: "Calibri", size: 18, bold: true, color: { argb: COLORS.white } };
    title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
    ws.getRow(1).height = 36;

    // ---------- Subtitle ----------
    ws.mergeCells(2, 1, 2, colCount);
    const sub = ws.getCell(2, 1);
    const generated = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    sub.value = `Generated: ${generated}   |   Total jobs: ${jobs.length}`;
    sub.font = { name: "Calibri", size: 10, italic: true, color: { argb: COLORS.white } };
    sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navyLight } };
    ws.getRow(2).height = 20;

    // Row 3 = spacer
    ws.getRow(3).height = 8;

    // ---------- Header row (row 4) ----------
    const headerRow = ws.getRow(4);
    COLUMNS.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = c.header;
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        ...thinBorder,
        bottom: { style: "medium", color: { argb: "FF0EA5E9" } },
      };
    });
    headerRow.height = 30;

    // ---------- Data rows ----------
    jobs.forEach((job, idx) => {
      const cost =
        job.approxCost !== null && job.approxCost !== undefined && job.approxCost !== ""
          ? Number(job.approxCost)
          : null;

      const row = ws.addRow({
        sno: idx + 1,
        complaintNo: job._id ? `SL${String(job._id).slice(-5)}` : "",
        booked: toExcelDate(job.complaintDate),
        schedule: toExcelDate(job.scheduleDate),
        solved: toExcelDate(job.solveDate),
        customerName: job.customer?.name ?? "",
        customerNumber: job.customer?.mobileNumber ?? "",
        address: job.customer?.address ?? "",
        brand: job.brand ?? "",
        product: job.product ?? "",
        model: job.modelNumber ?? "",
        serial: job.serialNumber ?? "",
        nature: job.natureOfWork ?? "",
        callType: job.callType ?? "",
        engineer: job.assignedServiceEngineer?.name ?? "",
        status: job.status ?? "",
        holdReason: job.holdReason ?? "",
        cancelReason: job.cancelReason ?? "",
        cost: Number.isFinite(cost) ? cost : null,
      });

      const isZebra = idx % 2 === 1;

      COLUMNS.forEach((c, i) => {
        const cell = row.getCell(i + 1);
        cell.font = { name: "Calibri", size: 10, color: { argb: COLORS.text } };
        cell.alignment = {
          vertical: "middle",
          horizontal: c.align || "left",
          wrapText: !!c.wrap,
          indent: c.align ? 0 : 1,
        };
        cell.border = thinBorder;
        if (isZebra) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.zebra } };
        }
        if (c.numFmt) cell.numFmt = c.numFmt;
      });

      // Status "badge"
      const statusCell = row.getCell(COLUMNS.findIndex((c) => c.key === "status") + 1);
      if (job.status) {
        const st = statusStyle(job.status);
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: st.bg } };
        statusCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: st.fg } };
      }

      // Muted look for empty-ish optional fields
      row.height = 22;
    });

    // ---------- Total row ----------
    if (jobs.length) {
      const costColIdx = COLUMNS.findIndex((c) => c.key === "cost") + 1;
      const firstDataRow = 5;
      const lastDataRow = 4 + jobs.length;
      const totalRow = ws.addRow([]);
      const labelCell = totalRow.getCell(costColIdx - 1);
      labelCell.value = "Total";
      labelCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.white } };
      labelCell.alignment = { horizontal: "right", vertical: "middle" };

      const sumCell = totalRow.getCell(costColIdx);
      const colLetter = ws.getColumn(costColIdx).letter;
      sumCell.value = { formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` };
      sumCell.numFmt = '"₹" #,##0';
      sumCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.white } };
      sumCell.alignment = { horizontal: "right", vertical: "middle" };

      for (let i = 1; i <= colCount; i++) {
        totalRow.getCell(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.navy },
        };
      }
      totalRow.height = 26;
    }

    // Filter dropdowns on header
    ws.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: colCount },
    };

    // ---------- Download ----------
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const safeFilename =
      String(filename || "jobs")
        .replace(/[<>:"/\\|?*]+/g, "-")
        .trim() || "jobs";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFilename}-${timestamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Excel export failed:", error);
    alert("Failed to generate Excel file. Please try again.");
  }
}