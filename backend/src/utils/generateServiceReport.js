// utils/pdf/generateServiceReport.js
const PDFDocument = require("pdfkit");

function generateServiceReportPDF(job) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 80; // minus left+right margins

    // ---- Header ----
    doc.rect(40, 40, pageWidth, 40).fill("#2563eb");
    doc.fillColor("#ffffff").fontSize(16).text("SERVICE REPORT", 50, 55);
    doc.fontSize(9).text(job.company?.companyName || "Company", 40, 55, {
      width: pageWidth - 10,
      align: "right",
    });
    doc.fillColor("#000000");
    doc.moveDown(3);

    // ---- Section helper: draws a boxed section with a title ----
    function section(title, rows) {
      const startY = doc.y;
      doc.fontSize(10).fillColor("#2563eb").text(title, 40, startY, { underline: false });
      doc.moveDown(0.3);

      rows.forEach(([label, value]) => {
        const y = doc.y;
        doc.fontSize(9).fillColor("#64748b").text(label, 40, y, { width: 150 });
        doc.fontSize(9).fillColor("#0f172a").text(String(value ?? "-"), 200, y, { width: pageWidth - 160 });
        doc.moveDown(0.6);
      });

      doc.moveDown(0.5);
      doc.strokeColor("#e2e8f0").moveTo(40, doc.y).lineTo(40 + pageWidth, doc.y).stroke();
      doc.moveDown(0.8);
    }

    section("Customer Details", [
      ["Name", job.customer?.name],
      ["Mobile", job.customer?.mobileNumber],
      ["Address", job.customer?.address],
    ]);

    section("Complaint Details", [
      ["Job No", job.complaintNumber],
      ["Booked", new Date(job.complaintDate).toLocaleString()],
      ["Service Engineer", job.assignedServiceEngineer?.name],
      ["Status", job.status],
      ["Solved", job.solveDate ? new Date(job.solveDate).toLocaleString() : "-"],
    ]);

    section("Product Details", [
      ["Brand / Product", `${job.brand || "-"} / ${job.product || "-"}`],
      ["Call Type", job.callType],
      ["Actual Issue", job.actualIssueFound],
      ["Corrective Action", job.correctiveActionTaken],
    ]);

    // ---- Spare parts as a real table with a header row and borders ----
    doc.fontSize(10).fillColor("#2563eb").text("Spare Parts Used");
    doc.moveDown(0.3);

    const colX = [40, 70, 320, 400, 480]; // S.No | Part | Qty | Rate placeholders
    const rowHeight = 22;
    let tableY = doc.y;

    function drawTableHeader(y) {
      doc.rect(40, y, pageWidth, rowHeight).fill("#f1f5f9");
      doc.fillColor("#334155").fontSize(9);
      doc.text("S.No", colX[0] + 4, y + 6, { width: 25 });
      doc.text("Part", colX[1], y + 6, { width: 240 });
      doc.text("Qty", colX[2], y + 6, { width: 70 });
    }

    drawTableHeader(tableY);
    tableY += rowHeight;

    if (job.consumedParts?.length) {
      job.consumedParts.forEach((p, i) => {
        doc.rect(40, tableY, pageWidth, rowHeight).stroke("#e2e8f0");
        doc.fillColor("#0f172a").fontSize(9);
        doc.text(String(i + 1), colX[0] + 4, tableY + 6, { width: 25 });
        doc.text(p.spareName || "Part", colX[1], tableY + 6, { width: 240 });
        doc.text(String(p.quantity), colX[2], tableY + 6, { width: 70 });
        tableY += rowHeight;
      });
    } else {
      doc.rect(40, tableY, pageWidth, rowHeight).stroke("#e2e8f0");
      doc.fillColor("#64748b").fontSize(9).text("No spare parts used.", 50, tableY + 6);
      tableY += rowHeight;
    }

    doc.y = tableY + 15;

    // ---- Payment summary, right-aligned like a totals box ----
    const total = (job.serviceCharge || 0) - (job.discount || 0);
    const paymentRows = [
      ["Service Charge", job.serviceCharge || 0],
      ["Discount", job.discount || 0],
      ["Total", total],
    ];
    paymentRows.forEach(([label, value], i) => {
      const y = doc.y;
      const isTotal = label === "Total";
      doc.fontSize(isTotal ? 11 : 9)
        .fillColor(isTotal ? "#16a34a" : "#64748b")
        .text(label, 300, y, { width: 150 });
      doc.fontSize(isTotal ? 11 : 9)
        .fillColor(isTotal ? "#16a34a" : "#0f172a")
        .text(String(value), 460, y, { width: 100, align: "right" });
      doc.moveDown(0.5);
    });

    doc.moveDown(2);
    doc.fontSize(7).fillColor("#94a3b8")
      .text("This is a computer-generated service report and does not require a signature.", 40, doc.y, {
        width: pageWidth,
        align: "center",
      });

    doc.end();
  });
}

module.exports = generateServiceReportPDF;