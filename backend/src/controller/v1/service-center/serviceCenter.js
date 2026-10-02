const Job = require("../../../models/Job");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const jwt = require("jsonwebtoken");

const SparePartStock = require("../../../models/SparePartStock");
const SparePartTransaction = require("../../../models/SparePartTransaction");
const { default: mongoose } = require("mongoose");

/* =========================================================
   STATUS CONSTANTS
   =========================================================
   These strings MUST match exactly what's stored in the DB.
   Current DB uses values WITH spaces (e.g. "Service Center Assigned").
   Update both this map and DB together if you rename anything.
   ========================================================= */
const JOB_STATUS = {
  REGISTERED: "Registered",
  SERVICE_CENTER_ASSIGNED: "Service Center Assigned",
  SERVICE_ENGINEER_ASSIGNED: "Service Engineer Assigned",
  PENDING: "Pending",
  HOLD: "Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Flat list — used for validation (e.g. updateJobStatus)
const JOB_STATUS_LIST = Object.values(JOB_STATUS);

// Every status a job can be in while it belongs to a service center.
const SERVICE_CENTER_STATUSES = [
  JOB_STATUS.REGISTERED,
  JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  JOB_STATUS.PENDING,
  JOB_STATUS.HOLD,
  JOB_STATUS.COMPLETED,
  JOB_STATUS.CANCELLED,
];

// "Open" = not finished. Completed and Cancelled are terminal.
const OPEN_STATUSES = [
  JOB_STATUS.REGISTERED,
  JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  JOB_STATUS.PENDING,
  JOB_STATUS.HOLD,
];

const DAY_MS = 24 * 60 * 60 * 1000;

/* =========================================================
   HELPERS
   ========================================================= */
function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* =========================================================
   JOBS
   ========================================================= */

// GET /service-center/jobs
exports.serviceCenterJobs = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const {
      status,
      search,
      jobSource,
      callType,
      natureOfWork,
      serviceEngineer,
      dateFrom,
      dateTo,
      sort = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { assignedServiceCenter: serviceCenter };
    if (status) filter.status = status;

    if (jobSource) filter.jobSource = jobSource;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;
    if (serviceEngineer) filter.assignedServiceEngineer = serviceEngineer;

    if (dateFrom || dateTo) {
      filter.complaintDate = {};
      if (dateFrom)
        filter.complaintDate.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo)
        filter.complaintDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (search && search.trim()) {
      const term = search.trim();
      const rx = new RegExp(escapeRegex(term), "i");

      const Customer = mongoose.model("Customer");
      const matchingCustomers = await Customer.find({
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

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const sortDir = sort === "asc" ? 1 : -1;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("customer")
        .populate("assignedServiceEngineer", "name contactNumber")
        .sort({ complaintDate: sortDir })
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
    console.error("serviceCenterJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

// GET /service-center/jobs-by-status
// UI sends a label; this endpoint translates it to a DB filter.
//   "Pending"     → not Completed, not Cancelled (active)
//   "Completed"   → exactly Completed
//   undefined/""  → everything except Completed
//   anything else → exact match
exports.serviceCenterJobsByStatus = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const {
      status,
      search,
      jobSource,
      callType,
      natureOfWork,
      serviceEngineer,
      dateFrom,
      dateTo,
      sort = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { assignedServiceCenter: serviceCenter };

    if (status === "Pending") {
      // active jobs, not finished or cancelled
      filter.status = {
        $nin: [JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED],
      };
    } else if (status === "Completed") {
      filter.status = JOB_STATUS.COMPLETED;
    } else if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: JOB_STATUS.COMPLETED };
    }

    if (jobSource) filter.jobSource = jobSource;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;
    if (serviceEngineer) filter.assignedServiceEngineer = serviceEngineer;

    if (dateFrom || dateTo) {
      filter.complaintDate = {};
      if (dateFrom)
        filter.complaintDate.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo)
        filter.complaintDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (search && search.trim()) {
      const term = search.trim();
      const rx = new RegExp(escapeRegex(term), "i");

      const Customer = mongoose.model("Customer");
      const matchingCustomers = await Customer.find({
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

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const sortDir = sort === "asc" ? 1 : -1;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("customer")
        .populate("assignedServiceEngineer", "name contactNumber")
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
    console.error("serviceCenterJobsByStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

// GET /service-center/getJobLogs/:id
exports.getJobLogs = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;

    const job = await Job.findOne({
      _id: id,
      assignedServiceCenter: serviceCenter,
    }).select("logs complaintNumber");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job.logs });
  } catch (error) {
    console.error("getJobLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job logs",
      error: error.message,
    });
  }
};

// POST /service-center/assignJob
// body: { jobIds: [id, ...], serviceEngineer, scheduleDate, note }
// Every assigned job lands on SERVICE_ENGINEER_ASSIGNED.
exports.assignJob = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { jobIds, serviceEngineer, scheduleDate, note } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0 || !serviceEngineer) {
      return res.status(400).json({
        success: false,
        message: "jobIds (array) and serviceEngineer are required",
      });
    }

    const engineer = await ServiceEngineer.findOne({
      _id: serviceEngineer,
      serviceCenter,
    });
    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Service engineer not found" });
    }

    const logLine = `Assigned to ${engineer.name}${note ? ` — ${note}` : ""}`;

    const result = await Job.updateMany(
      { _id: { $in: jobIds }, assignedServiceCenter: serviceCenter },
      {
        $set: {
          assignedServiceEngineer: serviceEngineer,
          ...(scheduleDate && { scheduleDate }),
          status: JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
          assignedAt: Date.now(),
        },
        $push: {
          logs: {
            at: Date.now(),
            actor: `Service Center:${serviceCenter}`,
            action: logLine,
          },
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Job(s) assigned",
      data: { matched: result.matchedCount, modified: result.modifiedCount },
    });
  } catch (error) {
    console.error("assignJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign job(s)",
      error: error.message,
    });
  }
};

// PUT /service-center/holdJob/:id
exports.holdJob = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;
    const { holdSubStatus, holdReason, holdPhotos, holdRemarks } = req.body;

    if (!holdSubStatus) {
      return res
        .status(400)
        .json({ success: false, message: "holdSubStatus is required" });
    }
    if (holdPhotos && (holdPhotos.length < 2 || holdPhotos.length > 5)) {
      return res.status(400).json({
        success: false,
        message: "holdPhotos must contain between 2 and 5 photos",
      });
    }

    const job = await Job.findOne({
      _id: id,
      assignedServiceCenter: serviceCenter,
    });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    job.status = JOB_STATUS.HOLD;
    job.holdSubStatus = holdSubStatus;
    job.holdReason = holdReason;
    job.holdPhotos = holdPhotos || [];
    job.holdRemarks = holdRemarks;
    job.logs.push({
      at: Date.now(),
      actor: `Service Center:${serviceCenter}`,
      action: `Put on hold — ${holdSubStatus}`,
    });

    await job.save();

    return res
      .status(200)
      .json({ success: true, message: "Job put on hold", data: job });
  } catch (error) {
    console.error("holdJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to hold job",
      error: error.message,
    });
  }
};

// PUT /service-center/closeJob/:id
exports.closeJob = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;
    const {
      consumedParts,
      sparesTotal,
      serviceCharge,
      discount,
      actualIssueFound,
      correctiveActionTaken,
      closurePhotos,
      customerSignature,
      otp,
    } = req.body;

    if (
      !actualIssueFound ||
      !correctiveActionTaken ||
      !customerSignature ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "actualIssueFound, correctiveActionTaken, customerSignature and otp are required",
      });
    }

    // TODO: replace with real OTP verification.
    const otpVerified = Boolean(otp);
    if (!otpVerified) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const job = await Job.findOne({
      _id: id,
      assignedServiceCenter: serviceCenter,
    });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    job.consumedParts = consumedParts || [];
    job.sparesTotal = sparesTotal || 0;
    job.serviceCharge = serviceCharge || 0;
    job.discount = discount || 0;
    job.actualIssueFound = actualIssueFound;
    job.correctiveActionTaken = correctiveActionTaken;
    job.closurePhotos = closurePhotos || [];
    job.customerSignature = customerSignature;
    job.closureOtpVerified = true;
    job.status = JOB_STATUS.COMPLETED;
    job.solveDate = Date.now();
    job.logs.push({
      at: Date.now(),
      actor: `Service Center:${serviceCenter}`,
      action: "Job closed",
    });

    await job.save();

    return res
      .status(200)
      .json({ success: true, message: "Job closed", data: job });
  } catch (error) {
    console.error("closeJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to close job",
      error: error.message,
    });
  }
};

// PUT /service-center/cancelJob/:id
exports.cancelJob = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "reason is required" });
    }

    const job = await Job.findOne({
      _id: id,
      assignedServiceCenter: serviceCenter,
    });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    if ([JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Job is already ${job.status.toLowerCase()} and can't be cancelled`,
      });
    }

    job.status = JOB_STATUS.CANCELLED;
    job.cancelReason = reason;
    job.cancelledAt = Date.now();
    job.logs.push({
      at: Date.now(),
      actor: `Service Center:${serviceCenter}`,
      action: `Cancelled — ${reason}`,
    });

    await job.save();

    return res
      .status(200)
      .json({ success: true, message: "Job cancelled", data: job });
  } catch (error) {
    console.error("cancelJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel job",
      error: error.message,
    });
  }
};

// PUT /service-center/updateJobStatus/:id
// body: { status, note }
exports.updateJobStatus = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status || !JOB_STATUS_LIST.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${JOB_STATUS_LIST.join(", ")}`,
      });
    }

    const job = await Job.findOne({
      _id: id,
      assignedServiceCenter: serviceCenter,
    });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const previousStatus = job.status;

    if (status === JOB_STATUS.COMPLETED) {
      job.solveDate = Date.now();
    }

    job.status = status;
    job.logs.push({
      at: Date.now(),
      actor: `Service Center:${serviceCenter}`,
      action: `Status changed from ${previousStatus} to ${status}${note ? ` — ${note}` : ""}`,
    });

    await job.save();

    return res
      .status(200)
      .json({ success: true, message: "Status updated", data: job });
  } catch (error) {
    console.error("updateJobStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

/* =========================================================
   SERVICE ENGINEERS (scoped to this service center only)
   ========================================================= */
exports.getServiceEngineers = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { status } = req.query;

    const filter = { serviceCenter };
    if (status) filter.status = status;

    const engineers = await ServiceEngineer.find(filter)
      .select("-password")
      .sort({ name: 1 });

    return res.status(200).json({ success: true, data: engineers });
  } catch (error) {
    console.error("getServiceEngineers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service engineers",
      error: error.message,
    });
  }
};

/* =========================================================
   PROFILE
   ========================================================= */
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await ServiceCenter.findById(req.user._id).select(
      "-password",
    );
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, address, contactPerson, contactNumber, gstNumber } = req.body;

    const updateFields = {
      ...(name && { name }),
      ...(address !== undefined && { address }),
      ...(contactPerson !== undefined && { contactPerson }),
      ...(contactNumber !== undefined && { contactNumber }),
      ...(gstNumber !== undefined && { gstNumber }),
    };

    const profile = await ServiceCenter.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    return res
      .status(200)
      .json({ success: true, message: "Profile updated", data: profile });
  } catch (error) {
    console.error("updateMyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "currentPassword and newPassword are required",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "newPassword must be at least 8 characters",
      });
    }

    const serviceCenter = await ServiceCenter.findById(req.user._id).select(
      "+password",
    );
    if (!serviceCenter) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const isMatch = await serviceCenter.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    serviceCenter.password = newPassword; // pre-save hook hashes it
    await serviceCenter.save();

    return res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("changeMyPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

/* =========================================================
   DASHBOARD
   =========================================================
   Single aggregation over all jobs for this service center:
     - count per status
     - total
     - aging buckets (open only)
   Every status key is always present in the response, even at 0.
   ========================================================= */
exports.getDashboardStats = async (req, res) => {
  try {
    const serviceCenterId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();

    const [result] = await Job.aggregate([
      { $match: { assignedServiceCenter: serviceCenterId } },
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],

          total: [{ $count: "count" }],

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

    // Initialize every known status at 0 so the map is complete.
    const byStatus = {};
    for (const status of SERVICE_CENTER_STATUSES) byStatus[status] = 0;
    for (const row of result.byStatus) {
      if (row._id != null) byStatus[row._id] = row.count;
    }

    const totalJobs = result.total[0]?.count ?? 0;
    const aging = result.aging[0] ?? { over1: 0, over3: 0, over7: 0 };

    const registered = byStatus[JOB_STATUS.REGISTERED] ?? 0;
    const pendingAtServiceCenter =
      byStatus[JOB_STATUS.SERVICE_CENTER_ASSIGNED] ?? 0;
    const jobsWithEngineer =
      (byStatus[JOB_STATUS.SERVICE_ENGINEER_ASSIGNED] ?? 0) +
      (byStatus[JOB_STATUS.PENDING] ?? 0);
    const pending = byStatus[JOB_STATUS.PENDING] ?? 0;
    const jobsOnHold = byStatus[JOB_STATUS.HOLD] ?? 0;
    const completedJobs = byStatus[JOB_STATUS.COMPLETED] ?? 0;
    const cancelledJobs = byStatus[JOB_STATUS.CANCELLED] ?? 0;

    const openJobs = OPEN_STATUSES.reduce(
      (sum, s) => sum + (byStatus[s] ?? 0),
      0,
    );

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

        // Rollups
        registered,
        pendingAtServiceCenter,
        jobsWithEngineer,
        pending,
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

/* =========================================================
   LOGIN ON BEHALF OF ENGINEER
   ========================================================= */
exports.serviceEngineerLoginByCenter = async (req, res, next) => {
  try {
    const { id } = req.params || "";
    if (!id) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide id" });
    }

    const login = await ServiceEngineer.findOne({
      _id: id,
      serviceCenter: req.user._id,
    });

    if (!login) {
      return res
        .status(400)
        .send({ status: false, message: "Engineer not found" });
    }

    const payload = {
      id: login._id,
      name: login.name,
      role: "service-engineer",
      username: login.username,
      company: login.company,
      serviceCenter: login.serviceCenter,
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 60 * 60 * 24 * 60 },
      (err, token) => {
        if (err) return res.status(500).json({ token: "Error signing token." });
        res.status(200).json({ token, engineer: payload, success: true });
      },
    );
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

/* =========================================================
   SPARE PARTS
   ========================================================= */
exports.getMySparePartStock = async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.user._id);
    if (!center) {
      return res
        .status(401)
        .json({ success: false, message: "service center not found" });
    }

    const stock = await SparePartStock.find({
      company: center.company,
      ownerType: "ServiceCenter",
      ownerId: center._id,
    })
      .populate(
        "sparePart",
        "brand product modelNumber spareName category unit status",
      )
      .sort({ updatedAt: -1 });

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

exports.getMySparePartTransactions = async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.user._id);
    if (!center) {
      return res
        .status(401)
        .json({ success: false, message: "service center not found" });
    }

    const transactions = await SparePartTransaction.find({
      company: center.company,
      $or: [{ fromId: center._id }, { toId: center._id }],
    })
      .populate("sparePart", "spareName brand product")
      .populate("job", "complaintNumber")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("getMySparePartTransactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};