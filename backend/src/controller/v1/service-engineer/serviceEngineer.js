const Job = require("../../../models/Job");
const Customer = require("../../../models/Customer");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const SparePartStock = require("../../../models/SparePartStock");
const SparePartTransaction = require("../../../models/SparePartTransaction");
const sendEmail = require("../../../utils/sendEmail");
const generateServiceReportPDF = require("../../../utils/generateServiceReport");
const { sendWhatsAppTemplate } = require("../../../utils/msg91");
const fs = require("fs");
const path = require("path");
const { default: mongoose } = require("mongoose");

const DAY_MS = 24 * 60 * 60 * 1000;

// GET /service-engineer/jobs
// query: status, search, jobSource, callType, natureOfWork,
//        dateFrom, dateTo, sort, page, limit
exports.serviceEngineerJobs = async (req, res) => {
  try {
    const serviceEngineerId = req.user._id;

    const {
      status,
      search,
      jobSource,
      callType,
      natureOfWork,
      dateFrom,
      dateTo,
      sort = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const engineer = await ServiceEngineer.findById(serviceEngineerId);
    if (!engineer) {
      return res.status(401).json({
        success: false,
        message: "Engineer not found",
      });
    }

    // ---- Base scope: jobs assigned to this engineer --------------------
    const filter = { assignedServiceEngineer: serviceEngineerId };

    // ---- Status filter --------------------------------------------------
    if (status) filter.status = status;

    // ---- Exact-match filters --------------------------------------------
    if (jobSource) filter.jobSource = jobSource;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;

    // ---- Date range on complaintDate (inclusive) ------------------------
    if (dateFrom || dateTo) {
      filter.complaintDate = {};
      if (dateFrom)
        filter.complaintDate.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo)
        filter.complaintDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    // ---- Free-text search ----------------------------------------------
    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");

      const matchingCustomers = await Customer.find({
        company: engineer.company,
        $or: [{ name: rx }, { mobileNumber: rx }],
      })
        .select("_id")
        .lean();

      filter.$or = [
        { complaintNumber: rx },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
        ...(mongoose.isValidObjectId(term) ? [{ _id: term }] : []),
      ];
    }

    // ---- Pagination ----------------------------------------------------
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const sortDir = sort === "asc" ? 1 : -1;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("customer", "name mobileNumber address")
        .populate("assignedServiceCenter", "name")
        .populate("assignedServiceEngineer", "name")
        .sort({ complaintDate: sortDir, createdAt: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.max(Math.ceil(total / limitNum), 1),
      },
    });
  } catch (error) {
    console.error("serviceEngineerJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};
// GET /api/service-engineer/getJobById/:id
exports.getServiceEngineerJobById = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id);
    if (!engineer) {
      return res
        .status(401)
        .json({ success: false, message: "engineer not found" });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      assignedServiceCenter: engineer.serviceCenter,
    })
      .populate("customer", "name mobileNumber alternateNumber address")
      .populate("assignedServiceCenter", "name contactNumber")
      .populate("assignedServiceEngineer", "name contactNumber");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("getServiceEngineerJobById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

// PUT /api/service-engineer/holdJob/:id
// body: { holdSubStatus, holdReason, holdPhotos: [String] (2–5), holdRemarks }
exports.serviceEngineerHoldJob = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id);
    if (!engineer) {
      return res
        .status(401)
        .json({ success: false, message: "engineer not found" });
    }

    const {
      holdSubStatus,
      holdReason,
      holdPhotos = [],
      holdRemarks,
    } = req.body;

    if (!holdSubStatus) {
      return res
        .status(400)
        .json({ success: false, message: "holdSubStatus is required" });
    }
    if (holdPhotos.length < 2 || holdPhotos.length > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Attach between 2 and 5 photos" });
    }

    // Ownership check: this engineer must actually be the one assigned to the job.
    const existing = await Job.findOne({
      _id: req.params.id,
      assignedServiceCenter: engineer.serviceCenter,
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not assigned to you",
      });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, assignedServiceCenter: engineer.serviceCenter },
      {
        $set: {
          status: "Hold",
          holdSubStatus,
          holdReason,
          holdPhotos,
          holdRemarks,
        },
        $push: {
          logs: {
            at: Date.now(),
            actor: `Service Engineer:${engineer._id}`,
            action: `Marked on hold — ${holdSubStatus}${holdReason ? `: ${holdReason}` : ""}`,
          },
        },
      },
      { new: true, runValidators: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Job put on hold", data: job });
  } catch (error) {
    console.error("serviceEngineerHoldJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to hold job",
      error: error.message,
    });
  }
};

async function generateAndSendServiceReport(jobId) {
  try {
    const populatedJob = await Job.findById(jobId)
      .populate("customer", "name mobileNumber email address")
      .populate("company", "companyName contactNumber gstNumber address")
      .populate("assignedServiceEngineer", "name")
      .populate("consumedParts.sparePart", "spareName brand product unit");

    if (!populatedJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    const complainid = "SL" + populatedJob?._id?.toString().slice(-5);

    const pdfBuffer = await generateServiceReportPDF(populatedJob, {
      companyAddress: populatedJob.company?.address || "",

      gstin: populatedJob.company?.gstNumber || "",

      supportPhone: populatedJob.company?.contactNumber || "",
    });

    const reportsDir = path.join(process.cwd(), "uploads", "service-reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, {
        recursive: true,
      });
    }

    const filename = `Complaint-${populatedJob.complaintNumber}.pdf`;

    const filePath = path.join(reportsDir, filename);

    await fs.promises.writeFile(filePath, pdfBuffer);

    const pdfUrl = `https://api-aceit.callbell.in/uploads/service-reports/${filename}`;

    const formatIndiaDateTime = (date) => {
      if (!date) return "-";

      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return "-";
      }

      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(parsedDate);
    };

    await sendWhatsAppTemplate({
      to: populatedJob.customer.mobileNumber,

      templateName: "complete",

      documentUrl: pdfUrl,

      namespace: process.env.NAMESPACE,

      variables: [
        populatedJob.customer?.name || "Customer",

        formatIndiaDateTime(populatedJob.complaintDate),

        complainid,

        populatedJob.brand || "-",

        populatedJob.product || "-",

        populatedJob.status || "-",

        populatedJob.assignedServiceEngineer?.name || "Service Engineer",

        formatIndiaDateTime(populatedJob.solveDate),

        populatedJob.approxCost ?? "-",

        populatedJob.company?.contactNumber || "-",
      ],
    });
  } catch (error) {
    console.error(`[REPORT] FAILED ${jobId}:`, error);

    throw error;
  }
}

exports.serviceEngineerCloseJob = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id);

    if (!engineer) {
      return res
        .status(401)
        .json({ success: false, message: "engineer not found" });
    }

    const {
      consumedParts = [],
      serviceCharge = 0,
      discount = 0,
      actualIssueFound,
      correctiveActionTaken,
      closurePhotos = [],
      customerSignature,
      otp,
      closureLocation,
    } = req.body;

    if (!actualIssueFound || !correctiveActionTaken || !customerSignature) {
      return res.status(400).json({
        success: false,
        message:
          "actualIssueFound, correctiveActionTaken and customerSignature are required",
      });
    }
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required to close the job" });
    }

    const existing = await Job.findOne({
      _id: req.params.id,
      assignedServiceEngineer: engineer._id,
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not assigned to you",
      });
    }

    const otpNumber = Number(otp);
    if (existing.otp !== otpNumber) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    const centerId = engineer.serviceCenter;

    for (const part of consumedParts) {
      if (!part.sparePart) continue;
      const stock = await SparePartStock.findOne({
        company: engineer.company,
        sparePart: part.sparePart,
        ownerType: "ServiceCenter",
        ownerId: centerId,
      });
      if (!stock || stock.quantity < part.quantity) {
        return res.status(409).json({
          success: false,
          message: `Not enough stock at your service center for this part (have ${stock?.quantity ?? 0}, need ${part.quantity}).`,
        });
      }
    }

    const sparesTotal = consumedParts.reduce(
      (sum, part) => sum + (Number(part.quantity) || 0),
      0,
    );

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, assignedServiceEngineer: engineer._id },
      {
        $set: {
          status: "Completed",
          solveDate: Date.now(),
          consumedParts,
          sparesTotal,
          serviceCharge,
          discount,
          actualIssueFound,
          correctiveActionTaken,
          closurePhotos,
          customerSignature,
          closureOtpVerified: true,
          ...(closureLocation?.latitude && closureLocation?.longitude
            ? {
                closureLocation: { ...closureLocation, capturedAt: Date.now() },
              }
            : {}),
        },
        $push: {
          logs: {
            at: Date.now(),
            actor: `Service Engineer:${engineer._id}`,
            action: "Job closed",
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found while updating" });
    }

    for (const part of consumedParts) {
      if (!part.sparePart) continue;
      await SparePartStock.updateOne(
        {
          company: engineer.company,
          sparePart: part.sparePart,
          ownerType: "ServiceCenter",
          ownerId: centerId,
        },
        { $inc: { quantity: -part.quantity } },
      );
      await SparePartTransaction.create({
        company: engineer.company,
        sparePart: part.sparePart,
        type: "Consume",
        fromType: "ServiceCenter",
        fromId: centerId,
        toType: null,
        toId: null,
        quantity: part.quantity,
        job: job._id,
        note: part.remarks,
        actor: `Service Engineer:${engineer._id}`,
      });
    }

    res.status(200).json({ success: true, message: "Job closed", data: job });

    generateAndSendServiceReport(job._id).catch((err) => {
      console.error(
        `Background report/notification failed for job ${job._id}:`,
        err,
      );
    });
  } catch (error) {
    console.error("serviceEngineerCloseJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to close job",
      error: error.message,
    });
  }
};

// Runs after the response has already been sent. Generates the PDF, saves
// it, and notifies the customer over WhatsApp — none of this blocks the
// engineer's "job closed" confirmation anymore.

// GET /api/service-engineer/getJobLogs/:id
exports.serviceEngineerGetJobLogs = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id);
    if (!engineer) {
      return res
        .status(401)
        .json({ success: false, message: "engineer not found" });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      assignedServiceCenter: engineer.serviceCenter,
    }).select("complaintNumber logs");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job.logs });
  } catch (error) {
    console.error("serviceEngineerGetJobLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job logs",
      error: error.message,
    });
  }
};

// GET /api/service-engineer/getProfile
exports.getMyProfile = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id).populate(
      "serviceCenter",
      "name",
    );

    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({ success: true, data: engineer });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// PUT /api/service-engineer/updateProfile
// body: { name, contactNumber, aadharNumber, username }
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, contactNumber, aadharNumber, username } = req.body;

    if (!name || !username) {
      return res
        .status(400)
        .json({ success: false, message: "name and username are required" });
    }

    if (username) {
      const clash = await ServiceEngineer.findOne({
        _id: { $ne: req.user._id },
        company: req.user.company,
        username,
      });
      if (clash) {
        return res
          .status(409)
          .json({ success: false, message: "Username already in use" });
      }
    }

    const engineer = await ServiceEngineer.findByIdAndUpdate(
      req.user._id,
      { $set: { name, contactNumber, aadharNumber, username } },
      { new: true, runValidators: true },
    ).populate("serviceCenter", "name");

    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile updated", data: engineer });
  } catch (error) {
    console.error("updateMyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// PUT /api/service-engineer/changePassword
// body: { currentPassword, newPassword }
exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "currentPassword and newPassword are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "newPassword must be at least 6 characters",
      });
    }

    const engineer = await ServiceEngineer.findById(req.user._id).select(
      "+password",
    );
    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const isMatch = await engineer.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    engineer.password = newPassword; // hashed automatically by the pre-save hook
    await engineer.save();

    return res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("changeMyPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// GET /service-engineer/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    const serviceEngineerId = new mongoose.Types.ObjectId(req.user._id);

    const engineer = await ServiceEngineer.findById(serviceEngineerId)
      .select("_id company serviceCenter")
      .lean();
    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: "Service Engineer not found",
      });
    }

    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // ---- Only the statuses that apply to a service engineer -----------
    // Nothing about "Registered" or "Service Center Assigned" here —
    // a job only reaches an engineer after those stages.
    const ENGINEER_STATUSES = [
      "Service Engineer Assigned",
      "Hold",
      "Completed",
      "Cancelled",
    ];

    // "Open" for aging = everything except Completed / Cancelled
    const OPEN_STATUSES = ["Service Engineer Assigned", "Hold"];

    const [result] = await Job.aggregate([
      { $match: { assignedServiceEngineer: serviceEngineerId } },
      {
        $facet: {
          // 1) Count per status
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],

          // 2) Total jobs
          total: [{ $count: "count" }],

          // 3) Aging — only over open jobs
          aging: [
            { $match: { status: { $in: OPEN_STATUSES } } },
            {
              $project: {
                ageMs: { $subtract: [now, "$complaintDate"] },
              },
            },
            {
              $project: {
                over1: { $gte: ["$ageMs", 1 * DAY_MS] },
                over3: { $gte: ["$ageMs", 3 * DAY_MS] },
                over7: { $gte: ["$ageMs", 7 * DAY_MS] },
              },
            },
            {
              $group: {
                _id: null,
                over1: { $sum: { $cond: ["$over1", 1, 0] } },
                over3: { $sum: { $cond: ["$over3", 1, 0] } },
                over7: { $sum: { $cond: ["$over7", 1, 0] } },
              },
            },
          ],
        },
      },
    ]);

    // Always emit every engineer status, even at 0.
    const byStatus = {};
    for (const s of ENGINEER_STATUSES) byStatus[s] = 0;
    for (const row of result.byStatus) {
      if (row._id != null) byStatus[row._id] = row.count;
    }

    const totalJobs = result.total[0]?.count ?? 0;
    const aging = result.aging[0] ?? { over1: 0, over3: 0, over7: 0 };

    const pendingJobs = byStatus["Service Engineer Assigned"] ?? 0;
    const jobsOnHold = byStatus["Hold"] ?? 0;
    const completedJobs = byStatus["Completed"] ?? 0;
    const cancelledJobs = byStatus["Cancelled"] ?? 0;

    const openJobs = pendingJobs + jobsOnHold;

    return res.status(200).json({
      success: true,
      data: {
        // Aging
        pending1Day: aging.over1,
        pending3Days: aging.over3,
        pending7Days: aging.over7,

        // Totals
        totalJobs,
        openJobs,

        // Rollups (only the ones that make sense for an engineer)
        pendingJobs,
        jobsOnHold,
        completedJobs,
        cancelledJobs,

        // Full breakdown
        byStatus,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};
exports.getMySparePartStock = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id);
    if (!engineer) {
      return res
        .status(401)
        .json({ success: false, message: "engineer not found" });
    }

    const stock = await SparePartStock.find({
      company: engineer.company,
      ownerType: "ServiceCenter",
      ownerId: engineer.serviceCenter,
      quantity: { $gt: 0 },
    })
      .populate(
        "sparePart",
        "brand product modelNumber spareName category unit",
      )
      .sort({ "sparePart.spareName": 1 });

    return res.status(200).json({ success: true, data: stock });
  } catch (error) {
    console.error("getMySparePartStock error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
      error: error.message,
    });
  }
};

// GET /service-engineer/my-jobs
// query: status (pending|completed|hold|cancelled|all),
//        search, jobSource, callType, natureOfWork,
//        dateFrom, dateTo, sort, page, limit
exports.myJobs = async (req, res) => {
  try {
    const serviceEngineerId = req.user._id;

    const {
      status,
      search,
      jobSource,
      callType,
      natureOfWork,
      dateFrom,
      dateTo,
      sort = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const engineer = await ServiceEngineer.findById(serviceEngineerId);
    if (!engineer) {
      return res.status(401).json({
        success: false,
        message: "Engineer not found",
      });
    }

    // ---- Base scope -----------------------------------------------------
    const filter = { assignedServiceEngineer: serviceEngineerId };

    // ---- Status tab mapping ---------------------------------------------
    // "pending" = all open jobs for the engineer (not Completed / Cancelled)
    switch ((status ?? "").toLowerCase()) {
      case "pending":
        filter.status = {
          $nin: ["Completed", "Cancelled"],
        };
        break;

      case "hold":
        filter.status = "Hold";
        break;

      case "completed":
        filter.status = "Completed";
        break;

      case "cancelled":
        filter.status = "Cancelled";
        break;

      case "all":
      case "":
      default:
        // no status → all jobs assigned to this engineer
        break;
    }

    // ---- Exact-match filters --------------------------------------------
    if (jobSource) filter.jobSource = jobSource;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;

    // ---- Date range on complaintDate ------------------------------------
    if (dateFrom || dateTo) {
      filter.complaintDate = {};
      if (dateFrom)
        filter.complaintDate.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo)
        filter.complaintDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    // ---- Free-text search ----------------------------------------------
    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");

      const matchingCustomers = await Customer.find({
        company: engineer.company,
        $or: [{ name: rx }, { mobileNumber: rx }],
      })
        .select("_id")
        .lean();

      filter.$or = [
        { complaintNumber: rx },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
        ...(mongoose.isValidObjectId(term) ? [{ _id: term }] : []),
      ];
    }

    // ---- Pagination -----------------------------------------------------
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const sortDir = sort === "asc" ? 1 : -1;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("customer", "name mobileNumber address")
        .populate("assignedServiceCenter", "name")
        .populate("assignedServiceEngineer", "name")
        .sort({ complaintDate: sortDir, createdAt: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.max(Math.ceil(total / limitNum), 1),
      },
    });
  } catch (error) {
    console.error("myJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};
// GET /service-engineer/account-status
exports.getAccountStatus = async (req, res) => {
  try {
    const engineer = await ServiceEngineer.findById(req.user._id).select(
      "status",
    );
    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Service engineer not found" });
    }

    const isInactive = engineer.status !== "Active";

    return res.status(200).json({
      success: true,
      data: {
        isRestricted: isInactive,
        reason: isInactive ? "inactive" : null,
      },
    });
  } catch (error) {
    console.error("getAccountStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check account status",
      error: error.message,
    });
  }
};
