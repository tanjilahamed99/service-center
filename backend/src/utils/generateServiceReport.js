// utils/pdf/generateServiceReport.js
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const https = require("https");
const http = require("http");

// Fetches an image URL into a Buffer — needed since pdfkit's doc.image()
// wants a local path or Buffer, not a remote URL directly.
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    if (!url) return resolve(null);
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode !== 200) return resolve(null); // don't fail the whole PDF over one missing image
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", () => resolve(null));
  });
}

async function generateServiceReportPDF(job, options = {}) {
  const {
    companyName = job.company?.companyName || "Service Company",
    companyAddress = "",
    gstin = "",
    state = "",
    salesPhone = "",
    supportPhone = "",
    trackUrl = "",
    payUrl = "",
  } = options;

  const [photoBuffer, sigBuffer, trackQR, payQR] = await Promise.all([
    fetchImageBuffer(job.closurePhotos?.[0]),
    fetchImageBuffer(job.customerSignature),
    trackUrl ? QRCode.toBuffer(trackUrl, { margin: 0, width: 80 }) : null,
    payUrl ? QRCode.toBuffer(payUrl, { margin: 0, width: 80 }) : null,
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const M = 40;
    const W = doc.page.width - M * 2;
    const colors = {
      label: "#64748b",
      value: "#0f172a",
      heading: "#1e293b",
      line: "#cbd5e1",
      balance: "#dc2626",
      brand: "#2563eb",
    };

    // ---------- Header ----------
    doc.fillColor(colors.brand).circle(M + 18, M + 18, 18).fill();
    doc.fillColor("#ffffff").fontSize(7).text("24x7", M + 6, M + 15, { width: 24, align: "center" });

    doc.fillColor(colors.heading).fontSize(14).text("SERVICE REPORT", M + 45, M + 5);

    doc.fontSize(9).fillColor(colors.heading).text(companyName, M, M, { width: W, align: "right" });
    doc.fontSize(7).fillColor(colors.label);
    if (companyAddress) doc.text(companyAddress, M, doc.y, { width: W, align: "right" });
    if (gstin) doc.text(`GSTIN: ${gstin}`, M, doc.y, { width: W, align: "right" });
    if (state) doc.text(`State: ${state}`, M, doc.y, { width: W, align: "right" });

    doc.moveDown(1);
    doc.strokeColor(colors.line).moveTo(M, doc.y).lineTo(M + W, doc.y).stroke();
    doc.moveDown(0.8);

    // ---------- Two-column labeled section helper ----------
    function twoColSection(leftTitle, leftRows, rightTitle, rightRows) {
      const startY = doc.y;
      const colW = W / 2 - 10;

      doc.fontSize(9).fillColor(colors.heading).text(leftTitle, M, startY, { underline: true });
      doc.fontSize(9).fillColor(colors.heading).text(rightTitle, M + W / 2 + 10, startY, { underline: true });

      let leftY = doc.y + 4;
      let rightY = leftY;

      leftRows.forEach(([label, value]) => {
        doc.fontSize(8).fillColor(colors.label).text(label, M, leftY, { width: 70, continued: true });
        doc.fillColor(colors.value).text(`: ${value ?? "-"}`, { width: colW - 70 });
        leftY = doc.y + 3;
      });

      rightRows.forEach(([label, value]) => {
        doc.fontSize(8).fillColor(colors.label).text(label, M + W / 2 + 10, rightY, { width: 90, continued: true });
        doc.fillColor(colors.value).text(`: ${value ?? "-"}`, { width: colW - 90 });
        rightY = doc.y + 3;
      });

      doc.y = Math.max(leftY, rightY) + 6;
      doc.strokeColor(colors.line).moveTo(M, doc.y).lineTo(M + W, doc.y).stroke();
      doc.moveDown(0.8);
    }

    twoColSection(
      "Customer Details",
      [
        [job.customer?.name?.toUpperCase() || "-", ""],
        [job.customer?.address || "-", ""],
        ["Mobile No", job.customer?.mobileNumber],
        ["Email", job.customer?.email || "-"],
      ].filter((r) => r[1] !== "" || r[0].includes(":")), // keep name/address as plain lines below
      "Complaint Details",
      [
        ["Job No", job.complaintNumber],
        ["Book Date & Time", new Date(job.complaintDate).toLocaleString()],
        ["Service Engineer", job.assignedServiceEngineer?.name || "-"],
        ["Job Status", job.status],
        ["Solve Date & Time", job.solveDate ? new Date(job.solveDate).toLocaleString() : "-"],
      ],
    );

    // Customer name/address rendered as plain lines above the label rows —
    // pdfkit doesn't support a mixed "no-label + labeled" row list cleanly,
    // so draw them explicitly instead of forcing them through the helper.
    // (This replaces the odd filter() above — simplest to just draw directly:)

    // ---------- Product / Call Type / Actual Issue / Corrective Action ----------
    function threeColRow(items) {
      const colW = W / 3;
      const startY = doc.y;
      let maxY = startY;
      items.forEach(([title, value], i) => {
        const x = M + i * colW;
        doc.fontSize(8).fillColor(colors.label).text(title, x, startY, { width: colW - 10 });
        doc.fontSize(9).fillColor(colors.value).text(value || "-", x, doc.y, { width: colW - 10 });
        maxY = Math.max(maxY, doc.y);
      });
      doc.y = maxY + 6;
    }

    threeColRow([
      ["Product Details", `${job.brand || ""} ${job.product || ""}`.trim()],
      ["Call Type", job.callType],
      ["Actual Issue", job.actualIssueFound],
    ]);
    threeColRow([
      ["Model Number", job.modelNumber || "-"],
      ["Problem / Work Reported", job.remark || "NOT WORKING"],
      ["Corrective Action", job.correctiveActionTaken],
    ]);

    doc.strokeColor(colors.line).moveTo(M, doc.y).lineTo(M + W, doc.y).stroke();
    doc.moveDown(0.8);

    // ---------- Call Closure Details table ----------
    doc.fontSize(9).fillColor(colors.heading).text("Call Closure Details", M, doc.y);
    doc.moveDown(0.3);

    const cols = [
      { label: "Sr No.", w: 40 },
      { label: "Spare Part Description", w: W - 40 - 60 - 60 - 60 },
      { label: "Quantity", w: 60 },
      { label: "Rate", w: 60 },
      { label: "Total", w: 60 },
    ];
    const rowH = 20;
    let tx = M;
    let ty = doc.y;

    doc.rect(M, ty, W, rowH).fill("#f1f5f9");
    doc.fillColor(colors.heading).fontSize(8);
    cols.forEach((c) => {
      doc.text(c.label, tx + 4, ty + 6, { width: c.w - 8 });
      tx += c.w;
    });
    ty += rowH;

    const parts = job.consumedParts?.length ? job.consumedParts : [];
    if (parts.length === 0) {
      doc.rect(M, ty, W, rowH).stroke(colors.line);
      doc.fillColor(colors.label).fontSize(8).text("No spare parts used", M + 4, ty + 6);
      ty += rowH;
    } else {
      parts.forEach((p, i) => {
        doc.rect(M, ty, W, rowH).stroke(colors.line);
        tx = M;
        const rate = p.rate || 0;
        const total = rate * (p.quantity || 0);
        const rowVals = [i + 1, p.spareName || "-", `${p.quantity} PCS`, rate, total];
        cols.forEach((c, ci) => {
          doc.fillColor(colors.value).fontSize(8).text(String(rowVals[ci]), tx + 4, ty + 6, { width: c.w - 8 });
          tx += c.w;
        });
        ty += rowH;
      });
    }
    doc.y = ty + 15;

    // ---------- Payment Details (left) + Picture of Work (right) ----------
    const sectionTop = doc.y;
    doc.fontSize(9).fillColor(colors.heading).text("Payment Details", M, sectionTop, { underline: true });
    doc.fontSize(9).fillColor(colors.heading).text("Picture of Work", M + W / 2 + 10, sectionTop, { underline: true });

    let py = doc.y + 4;
    const total = (job.serviceCharge || 0) - (job.discount || 0);
    const paymentRows = [
      ["Spare Total", `Rs. ${job.sparesTotal || 0}`],
      ["Service Charge", `Rs. ${job.serviceCharge || 0}`],
      ["Total Amount", `Rs. ${total}`],
      ["Discount Amount", `Rs. ${job.discount || 0}`],
      ["Received Amount", `Rs. ${job.receivedAmount || 0}`],
    ];
    paymentRows.forEach(([label, value]) => {
      doc.fontSize(8).fillColor(colors.label).text(label, M, py, { width: 100, continued: true });
      doc.fillColor(colors.value).text(`: ${value}`, { width: 120 });
      py = doc.y + 3;
    });
    doc.fontSize(10).fillColor(colors.balance).text("Balance", M, py, { width: 100, continued: true });
    doc.fillColor(colors.balance).text(`: Rs. ${(total - (job.receivedAmount || 0)).toFixed(2)}`, { width: 120 });
    py = doc.y + 3;

    const photoX = M + W / 2 + 10;
    const photoY = sectionTop + 16;
    const photoBoxSize = 90;
    if (photoBuffer) {
      try {
        doc.image(photoBuffer, photoX, photoY, { fit: [photoBoxSize, photoBoxSize] });
      } catch {
        doc.rect(photoX, photoY, photoBoxSize, photoBoxSize).stroke(colors.line);
      }
    } else {
      doc.rect(photoX, photoY, photoBoxSize, photoBoxSize).stroke(colors.line);
      doc.fontSize(7).fillColor(colors.label).text("No photo", photoX, photoY + 40, { width: photoBoxSize, align: "center" });
    }

    doc.y = Math.max(py, photoY + photoBoxSize) + 15;

    // ---------- Work Done ----------
    doc.fontSize(8).fillColor(colors.label).text("Work Done", M, doc.y, { continued: true });
    doc.fillColor(colors.value).text(` : ${job.correctiveActionTaken || "work done"}`);
    doc.moveDown(0.8);
    doc.strokeColor(colors.line).moveTo(M, doc.y).lineTo(M + W, doc.y).stroke();
    doc.moveDown(0.6);

    // ---------- Terms & QR / Signature ----------
    const termsTop = doc.y;
    const terms = [
      "Payment Terms: The client shall pay the service provider within [insert timeframe, e.g., 30 days] from the date of invoice.",
      "Scope of Work: The service provider agrees to perform the work described in the job sheet, and the client agrees to pay for the services rendered.",
      "Warranty and Liability: The service provider offers a 30 Days Warranty.",
      "Spares comes with 30 Days Warranty.",
      "Material Once sold will not be taken back.",
    ];
    doc.fontSize(7).fillColor(colors.label).text("TERMS & CONDITIONS", M, termsTop);
    doc.fontSize(6.5);
    terms.forEach((t, i) => {
      doc.fillColor(colors.label).text(`${i + 1}. ${t}`, M, doc.y + 3, { width: W - 200 });
    });

    const qrY = termsTop;
    const qrSize = 55;
    if (trackQR) {
      doc.image(trackQR, M + W - 190, qrY, { width: qrSize });
      doc.fontSize(6).fillColor(colors.label).text("SCAN ME", M + W - 190, qrY + qrSize + 2, { width: qrSize, align: "center" });
      doc.text("to track your Job", M + W - 190, doc.y, { width: qrSize, align: "center" });
    }
    if (payQR) {
      doc.image(payQR, M + W - 120, qrY, { width: qrSize });
      doc.fontSize(6).fillColor(colors.label).text("SCAN ME", M + W - 120, qrY + qrSize + 2, { width: qrSize, align: "center" });
      doc.text("To Pay Online", M + W - 120, doc.y, { width: qrSize, align: "center" });
    }
    if (sigBuffer) {
      try {
        doc.image(sigBuffer, M + W - 60, qrY + 5, { fit: [55, 30] });
      } catch {}
    }
    doc.fontSize(6).fillColor(colors.label).text("Customer Signature", M + W - 65, qrY + 45, { width: 65, align: "center" });

    doc.y = Math.max(doc.y, qrY + qrSize + 20) + 10;

    // ---------- Footer ----------
    doc.strokeColor(colors.line).moveTo(M, doc.y).lineTo(M + W, doc.y).stroke();
    doc.moveDown(0.4);
    doc.fontSize(8).fillColor(colors.heading).text(
      `SALES : ${salesPhone}   |   CUSTOMER SUPPORT : ${supportPhone}`,
      M,
      doc.y,
      { width: W, align: "center" },
    );
    doc.fontSize(6).fillColor(colors.label).text(
      "This is computer generated Service Report and does not require any signature.",
      M,
      doc.y + 3,
      { width: W, align: "center" },
    );

    doc.end();
  });
}

module.exports = generateServiceReportPDF;