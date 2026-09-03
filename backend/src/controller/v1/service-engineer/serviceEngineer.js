const Job = require("../../../models/Job");
const Customer = require("../../../models/Customer");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const bcrypt = require("bcrypt");

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
      assignedServiceCenter: engineer.serviceCenter,
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

    console.log(engineer);

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

// PUT /api/service-engineer/closeJob/:id
// body: { consumedParts, serviceCharge, discount, actualIssueFound,
//         correctiveActionTaken, closurePhotos, customerSignature, otp }
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
    } = req.body;

    if (!actualIssueFound || !correctiveActionTaken || !customerSignature) {
      return res.status(400).json({
        success: false,
        message:
          "actualIssueFound, correctiveActionTaken and customerSignature are required",
      });
    }
    // TODO: verify `otp` against your SMS/OTP provider before trusting closureOtpVerified.
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required to close the job" });
    }

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

    const sparesTotal = consumedParts.reduce(
      (sum, part) => sum + (Number(part.quantity) || 0),
      0,
    );

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, assignedServiceCenter: engineer.serviceCenter },
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
