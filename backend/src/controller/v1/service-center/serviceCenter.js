const bcrypt = require("bcrypt");

const Job = require("../../../models/Job");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const jwt = require("jsonwebtoken");

const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_STATUSES = [
  "Registered",
  "Service Center Assigned",
  "Service Engineer Assigned",
  "Hold",
];

/* =========================================================
   JOBS
   ========================================================= */

// GET /service-center/jobs?status=Hold
exports.serviceCenterJobs = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { status } = req.query;

    const filter = { assignedServiceCenter: serviceCenter };
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate("customer")
      .populate("assignedServiceEngineer", "name contactNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error("serviceCenterJobs error:", error);
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
          status: "Service Engineer Assigned",
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
// body: { holdSubStatus, holdReason, holdPhotos, holdRemarks }
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

    job.status = "Hold";
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
// body: { consumedParts, sparesTotal, serviceCharge, discount, actualIssueFound,
//         correctiveActionTaken, closurePhotos, customerSignature, otp }
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

    // TODO: replace with real OTP verification (e.g. against an OTP sent to the
    // customer at closure time). This currently only checks that one was submitted.
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
    job.status = "Completed";
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
// body: { reason }
exports.cancelJob = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    console.log(id);

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
    if (["Completed", "Cancelled"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Job is already ${job.status.toLowerCase()} and can't be cancelled`,
      });
    }

    job.status = "Cancelled";
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
// Status-only edit — for reassignment use assignJob, for hold use holdJob,
// for closing use closeJob. This is for direct/manual status corrections.
const JOB_STATUS = [
  "Registered",
  "Service Center Assigned",
  "Service Engineer Assigned",
  "Hold",
  "Completed",
  "Cancelled",
];

exports.updateJobStatus = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status || !JOB_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${JOB_STATUS.join(", ")}`,
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

// GET /service-center/getServiceEngineers
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

// GET /service-center/getProfile
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

// PUT /service-center/updateProfile
// body: { name, address, contactPerson, contactNumber, gstNumber }
// NOTE: matches the ServiceCenter schema's actual fields — not aadharNumber,
// which belongs to ServiceEngineer.
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

// PUT /service-center/changePassword
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
   ========================================================= */

// GET /service-center/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    const serviceCenter = req.user._id;
    const now = new Date();

    const [
      pending1Day,
      pending3Days,
      pending7Days,
      totalJobs,
      pendingAtServiceCenter,
      jobsOnHold,
      completedJobs,
    ] = await Promise.all([
      Job.countDocuments({
        assignedServiceCenter: serviceCenter,
        status: { $in: OPEN_STATUSES },
        complaintDate: { $lte: new Date(now - 1 * DAY_MS) },
      }),
      Job.countDocuments({
        assignedServiceCenter: serviceCenter,
        status: { $in: OPEN_STATUSES },
        complaintDate: { $lte: new Date(now - 3 * DAY_MS) },
      }),
      Job.countDocuments({
        assignedServiceCenter: serviceCenter,
        status: { $in: OPEN_STATUSES },
        complaintDate: { $lte: new Date(now - 7 * DAY_MS) },
      }),
      Job.countDocuments({ assignedServiceCenter: serviceCenter }),
      Job.countDocuments({
        assignedServiceCenter: serviceCenter,
        status: "Service Center Assigned",
      }),
      Job.countDocuments({
        assignedServiceCenter: serviceCenter,
        status: "Hold",
      }),
      Job.countDocuments({
        assignedServiceCenter: serviceCenter,
        status: "Completed",
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pending1Day,
        pending3Days,
        pending7Days,
        totalJobs,
        pendingAtServiceCenter,
        jobsOnHold,
        completedJobs,
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

    // use appropriate status code to send data
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
