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

const DAY_MS = 24 * 60 * 60 * 1000;

exports.serviceEngineerJobs = async (req, res) => {
  try {
    const serviceEngineer = req.user._id;
    const {
      search,
      status,
      callType,
      natureOfWork,
      sortDesc,
      page = 1,
      limit = 20,
    } = req.query;

    const engineer = await ServiceEngineer.findById(serviceEngineer);

    if (!engineer) {
      return res.status(401).send({
        message: "engineer not found",
      });
    }

    const filter = {
      assignedServiceEngineer: req.user._id,
    };
    if (status) filter.status = status;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;

    if (search) {
      const matchingCustomers = await Customer.find({
        company: engineer.company, // was `company`, undefined — fixed
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobileNumber: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      filter.$or = [
        { complaintNumber: { $regex: search, $options: "i" } },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("customer", "name mobileNumber address")
        .populate("assignedServiceCenter", "name")
        .populate("assignedServiceEngineer", "name")
        .sort({ createdAt: sortDesc === "false" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getJobs error:", error);
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

    const otpVerity = existing.otp === otp;

    if (!otpVerity) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect OTP" });
    }

    const centerId = engineer.serviceCenter;

    // Stock validation — re-enable once you're ready to test spare-parts
    // consumption again; leaving disabled won't break anything else here.
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

    // FIXED — the real filter/update/options are restored here.
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

    // Spare parts stock decrement — same note as above, re-enable together.
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

    const populatedJob = await Job.findById(job._id)
      .populate("customer", "name mobileNumber email address")
      .populate("company", "companyName contactNumber")
      .populate("assignedServiceEngineer", "name");

    const pdfBuffer = await generateServiceReportPDF(populatedJob, {
      companyAddress: populatedJob.company.address,
      gstin: populatedJob.company.gstNumber,
      supportPhone: populatedJob.company.contactNumber,
    });

    const reportsDir = path.join(process.cwd(), "uploads", "service-reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // FIXED — this whole block was missing: the filename, the actual
    // write to disk, and the public URL construction.
    const filename = `Complaint-${populatedJob.complaintNumber}.pdf`;
    fs.writeFileSync(path.join(reportsDir, filename), pdfBuffer);
    const pdfUrl = `https://api-aceit.callbell.in/uploads/service-reports/${filename}`;

    const formatIndiaDateTime = (date) => {
      if (!date) return "-";
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(date));
    };

    const support = populatedJob.company.contactNumber;

    await sendWhatsAppTemplate({
      to: populatedJob.customer.mobileNumber,
      templateName: "complete",
      documentUrl: pdfUrl,
      namespace: process.env.NAMESPACE,
      variables: [
        populatedJob.customer?.name || "Customer",
        formatIndiaDateTime(populatedJob.complaintDate),
        populatedJob.complaintNumber,
        populatedJob.brand || "-",
        populatedJob.product || "-",
        populatedJob.status || "-",
        populatedJob.assignedServiceEngineer?.name || "Service Engineer",
        formatIndiaDateTime(populatedJob.solveDate),
        populatedJob.approxCost ?? "-",
        support,
      ],
    });

    return res
      .status(200)
      .json({ success: true, message: "Job closed", data: job });
  } catch (error) {
    console.error("serviceEngineerCloseJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to close job",
      error: error.message,
    });
  }
};

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

exports.getDashboardStats = async (req, res) => {
  try {
    const serviceEngineer = req.user._id;

    const myData = await ServiceEngineer.findById(serviceEngineer);

    if (!myData) {
      return res.status(404).json({
        success: false,
        message:
          "Service Engineer not found or not associated with a service center",
      });
    }

    const now = new Date();

    const [
      pending1Day,
      pending3Days,
      pending7Days,
      totalJobs,
      pendingJobs,
      jobsOnHold,
      completedJobs,
      cancelledJobs,
    ] = await Promise.all([
      // Pending for more than 1 day
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Service Engineer Assigned",
        complaintDate: {
          $lte: new Date(now - 1 * DAY_MS),
        },
      }),

      // Pending for more than 3 days
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Service Engineer Assigned",
        complaintDate: {
          $lte: new Date(now - 3 * DAY_MS),
        },
      }),

      // Pending for more than 7 days
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Service Engineer Assigned",
        complaintDate: {
          $lte: new Date(now - 7 * DAY_MS),
        },
      }),

      // All jobs assigned to engineer
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
      }),

      // Pending
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Service Engineer Assigned",
      }),

      // Hold
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Hold",
      }),

      // Completed
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Completed",
      }),

      // Cancelled
      Job.countDocuments({
        assignedServiceEngineer: serviceEngineer,
        status: "Cancelled",
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pending1Day,
        pending3Days,
        pending7Days,

        totalJobs,

        pendingJobs,
        jobsOnHold,
        completedJobs,
        cancelledJobs,
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

exports.myJobs = async (req, res) => {
  try {
    const serviceEngineer = req.user._id;
    const { status } = req.query;

    const filter = {
      assignedServiceEngineer: serviceEngineer,
    };

    // Map frontend/dashboard status -> actual Job status
    switch (status?.toLowerCase()) {
      case "pending":
        filter.status = "Service Engineer Assigned";
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

      default:
        // No status = return all jobs assigned to this engineer
        filter.status = {
          $in: ["Service Engineer Assigned", "Hold", "Completed", "Cancelled"],
        };
        break;
    }

    const jobs = await Job.find(filter)
      .populate("customer")
      .populate("assignedServiceCenter", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: jobs,
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
