// utils/pdf/generateServiceReport.js
const PDFDocument = require("pdfkit");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");

function fetchImageBuffer(url, redirectsLeft = 3) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          return resolve(
            fetchImageBuffer(res.headers.location, redirectsLeft - 1),
          );
        }
        if (res.statusCode !== 200) {
          console.warn(
            `[PDF] Image fetch failed (status ${res.statusCode}) for ${url}`,
          );
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", (err) => {
        console.warn(`[PDF] Image fetch error for ${url}:`, err.message);
        resolve(null);
      });
  });
}

// Resolves an image value to a Buffer regardless of whether it's a genuine
// remote URL or a path to a file already sitting on this VPS (same idea as
// the logo, which is already read straight off disk). Tries local disk
// first for anything that isn't clearly http(s), since that's how the logo
// is stored and closure photos/signatures are most likely stored the same
// way rather than fetched over the network.
async function resolveImageBuffer(value) {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return fetchImageBuffer(value);
  }

  if (value.startsWith("data:")) {
    const base64 = value.split(",")[1];
    return base64 ? Buffer.from(base64, "base64") : null;
  }

  // Treat as a local path. Strip a leading slash so it joins cleanly, and
  // try both "as given" and "under uploads/" since we don't know which
  // convention your upload code uses without seeing it.
  const trimmed = value.replace(/^\/+/, "");
  const candidates = [
    path.join(process.cwd(), trimmed),
    path.join(process.cwd(), "uploads", trimmed),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.promises.readFile(candidate);
    }
  }

  console.warn(`[PDF] Could not resolve image as URL or local file: ${value}`);
  return null;
}

const IST = "Asia/Kolkata";

function formatIST(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
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
  } = options;

  const logoPath = path.join(process.cwd(), "uploads", "assets", "logo.png");
  const logoBuffer = fs.existsSync(logoPath)
    ? await fs.promises.readFile(logoPath)
    : null;

  const [photoBuffer, sigBuffer] = await Promise.all([
    fetchImageBuffer(job.closurePhotos?.[0]),
    fetchImageBuffer(job.customerSignature),
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
      brand: "#2563eb",
    };

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, M, M, { fit: [36, 36] });
      } catch {
        doc
          .fillColor(colors.brand)
          .circle(M + 18, M + 18, 18)
          .fill();
        doc
          .fillColor("#ffffff")
          .fontSize(7)
          .text("24x7", M + 6, M + 15, { width: 24, align: "center" });
      }
    } else {
      doc
        .fillColor(colors.brand)
        .circle(M + 18, M + 18, 18)
        .fill();
      doc
        .fillColor("#ffffff")
        .fontSize(7)
        .text("24x7", M + 6, M + 15, { width: 24, align: "center" });
    }

    doc
      .fillColor(colors.heading)
      .fontSize(14)
      .text("SERVICE REPORT", M + 45, M + 5);

    doc
      .fontSize(9)
      .fillColor(colors.heading)
      .text(companyName, M, M, { width: W, align: "right" });
    doc.fontSize(7).fillColor(colors.label);
    if (companyAddress)
      doc.text(companyAddress, M, doc.y, { width: W, align: "right" });
    if (gstin)
      doc.text(`GSTIN: ${gstin}`, M, doc.y, { width: W, align: "right" });
    if (state)
      doc.text(`State: ${state}`, M, doc.y, { width: W, align: "right" });

    doc.moveDown(1);
    doc
      .strokeColor(colors.line)
      .moveTo(M, doc.y)
      .lineTo(M + W, doc.y)
      .stroke();
    doc.moveDown(0.8);

    const sectionStartY = doc.y;
    const colW = W / 2 - 10;

    doc
      .fontSize(9)
      .fillColor(colors.heading)
      .text("Customer Details", M, sectionStartY, { underline: true });
    doc
      .fontSize(9)
      .fillColor(colors.heading)
      .text("Complaint Details", M + W / 2 + 10, sectionStartY, {
        underline: true,
      });

    let leftY = doc.y + 4;
    doc
      .fontSize(10)
      .fillColor(colors.value)
      .text(
        job.customer?.name?.toUpperCase() || "CUSTOMER NAME NOT AVAILABLE",
        M,
        leftY,
        {
          width: colW,
          bold: true,
        },
      );
    leftY = doc.y + 2;
    doc
      .fontSize(8)
      .fillColor(colors.label)
      .text(job.customer?.address || "-", M, leftY, { width: colW });
    leftY = doc.y + 4;

    const customerRows = [["Mobile No", job.customer?.mobileNumber]];
    customerRows.forEach(([label, value]) => {
      doc
        .fontSize(8)
        .fillColor(colors.label)
        .text(label, M, leftY, { width: 70, continued: true });
      doc
        .fillColor(colors.value)
        .text(`: ${value ?? "-"}`, { width: colW - 70 });
      leftY = doc.y + 3;
    });

    const rightY = sectionStartY + 16;

    const complainid = "SL" + job._id;

    const complaintRows = [
      ["Job No", complainid],
      ["Book Date & Time", formatIST(job.complaintDate)],
      ["Service Engineer", job.assignedServiceEngineer?.name || "-"],
      ["Job Status", job.status],
      ["Solve Date & Time", formatIST(job.solveDate)],
    ];
    let rightYCursor = rightY;
    complaintRows.forEach(([label, value]) => {
      doc
        .fontSize(8)
        .fillColor(colors.label)
        .text(label, M + W / 2 + 10, rightYCursor, {
          width: 90,
          continued: true,
        });
      doc
        .fillColor(colors.value)
        .text(`: ${value ?? "-"}`, { width: colW - 90 });
      rightYCursor = doc.y + 3;
    });

    doc.y = Math.max(leftY, rightYCursor) + 6;
    doc
      .strokeColor(colors.line)
      .moveTo(M, doc.y)
      .lineTo(M + W, doc.y)
      .stroke();
    doc.moveDown(0.8);

    function threeColRow(items) {
      const colWidth = W / 3;
      const startY = doc.y;
      let maxY = startY;
      items.forEach(([title, value], i) => {
        const x = M + i * colWidth;
        doc
          .fontSize(8)
          .fillColor(colors.label)
          .text(title, x, startY, { width: colWidth - 10 });
        doc
          .fontSize(9)
          .fillColor(colors.value)
          .text(value || "-", x, doc.y, { width: colWidth - 10 });
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

    doc
      .strokeColor(colors.line)
      .moveTo(M, doc.y)
      .lineTo(M + W, doc.y)
      .stroke();
    doc.moveDown(0.8);

    doc
      .fontSize(9)
      .fillColor(colors.heading)
      .text("Call Closure Details", M, doc.y);
    doc.moveDown(0.3);

    const cols = [
      { label: "Sr No.", w: 50 },
      { label: "Spare Part Description", w: W - 50 - 120 },
      { label: "Quantity", w: 120 },
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
      doc
        .fillColor(colors.label)
        .fontSize(8)
        .text("No spare parts used", M + 4, ty + 6);
      ty += rowH;
    } else {
      parts.forEach((p, i) => {
        doc.rect(M, ty, W, rowH).stroke(colors.line);
        tx = M;
        const partName = p.sparePart?.spareName || p.sparePart?.product || "-";
        const rowVals = [i + 1, partName, `${p.quantity ?? 0} PCS`];
        cols.forEach((c, ci) => {
          doc
            .fillColor(colors.value)
            .fontSize(8)
            .text(String(rowVals[ci]), tx + 4, ty + 6, { width: c.w - 8 });
          tx += c.w;
        });
        ty += rowH;
      });
    }
    doc.y = ty + 15;

    const sectionTop = doc.y;
    doc
      .fontSize(9)
      .fillColor(colors.heading)
      .text("Payment Details", M, sectionTop, { underline: true });
    doc
      .fontSize(9)
      .fillColor(colors.heading)
      .text("Picture of Work", M + W / 2 + 10, sectionTop, { underline: true });

    let py = doc.y + 4;
    doc
      .fontSize(10)
      .fillColor(colors.value)
      .text("Approximate Cost", M, py, { width: 120, continued: true });
    doc
      .fillColor(colors.value)
      .text(`: Rs. ${job.approxCost ?? "-"}`, { width: 120 });
    py = doc.y + 3;

    const photoX = M + W / 2 + 10;
    const photoY = sectionTop + 16;
    const photoBoxSize = 90;
    if (photoBuffer) {
      try {
        doc
          .rect(photoX, photoY, photoBoxSize, photoBoxSize)
          .stroke(colors.line);
        doc.image(photoBuffer, photoX, photoY, {
          fit: [photoBoxSize, photoBoxSize],
        });
      } catch {
        doc
          .rect(photoX, photoY, photoBoxSize, photoBoxSize)
          .stroke(colors.line);
        doc
          .fontSize(7)
          .fillColor(colors.label)
          .text("Photo failed to load", photoX, photoY + 40, {
            width: photoBoxSize,
            align: "center",
          });
      }
    } else {
      doc
        .rect(photoX, photoY, photoBoxSize, photoBoxSize)
        .dash(3, { space: 2 })
        .stroke(colors.line)
        .undash();
      doc
        .fontSize(7)
        .fillColor(colors.label)
        .text("No photo attached", photoX, photoY + 40, {
          width: photoBoxSize,
          align: "center",
        });
    }

    doc.y = Math.max(py, photoY + photoBoxSize) + 15;

    doc
      .fontSize(8)
      .fillColor(colors.label)
      .text("Work Done", M, doc.y, { continued: true });
    doc
      .fillColor(colors.value)
      .text(` : ${job.correctiveActionTaken || "work done"}`);
    doc.moveDown(0.8);
    doc
      .strokeColor(colors.line)
      .moveTo(M, doc.y)
      .lineTo(M + W, doc.y)
      .stroke();
    doc.moveDown(0.6);

    const termsTop = doc.y;
    const terms = [
      "Payment Terms: The client shall pay the service provider within [insert timeframe, e.g., 30 days] from the date of invoice.",
      "Scope of Work: The service provider agrees to perform the work described in the job sheet, and the client agrees to pay for the services rendered.",
      "Warranty and Liability: The service provider offers a 30 Days Warranty.",
      "Spares comes with 30 Days Warranty.",
      "Material Once sold will not be taken back.",
    ];
    doc
      .fontSize(7)
      .fillColor(colors.label)
      .text("TERMS & CONDITIONS", M, termsTop);
    doc.fontSize(6.5);
    terms.forEach((t, i) => {
      doc
        .fillColor(colors.label)
        .text(`${i + 1}. ${t}`, M, doc.y + 3, { width: W - 100 });
    });

    const sigY = termsTop;
    if (sigBuffer) {
      try {
        doc.image(sigBuffer, M + W - 90, sigY + 5, { fit: [80, 35] });
      } catch {}
    }
    doc
      .fontSize(6)
      .fillColor(colors.label)
      .text("Customer Signature", M + W - 90, sigY + 45, {
        width: 80,
        align: "center",
      });

    doc.y = Math.max(doc.y, sigY + 60) + 10;

    doc
      .strokeColor(colors.line)
      .moveTo(M, doc.y)
      .lineTo(M + W, doc.y)
      .stroke();
    doc.moveDown(0.4);
    doc
      .fontSize(8)
      .fillColor(colors.heading)
      .text(
        `SALES : ${salesPhone}   |   CUSTOMER SUPPORT : ${supportPhone}`,
        M,
        doc.y,
        {
          width: W,
          align: "center",
        },
      );
    doc
      .fontSize(6)
      .fillColor(colors.label)
      .text(
        "This is computer generated Service Report and does not require any signature.",
        M,
        doc.y + 3,
        {
          width: W,
          align: "center",
        },
      );
    doc
      .fontSize(6)
      .fillColor(colors.label)
      .text("Service CRM", M, doc.y + 2, { width: W, align: "center" });

    doc.end();
  });
}

module.exports = generateServiceReportPDF;
