const Job = require("../../../models/Job");
const Customer = require("../../../models/Customer");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const SparePartStock = require("../../../models/SparePartStock");
const SparePartTransaction = require("../../../models/SparePartTransaction");
const sendEmail = require("../../../utils/sendEmail");
const generateServiceReportPDF = require("../../../utils/generateServiceReport");

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

    // Validate stock BEFORE touching anything, so a mid-way failure can't
    // leave some parts decremented and others not.
    const centerId = engineer.serviceCenter;
    for (const part of consumedParts) {
      if (!part.sparePart) continue; // free-text-only line item, no inventory link
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

    // Decrement stock + log a Consume transaction for every linked part.
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

    // send otp to customer
//     const populatedJob = await Job.findById(job._id)
//       .populate("customer", "name mobileNumber email address")
//       .populate("company", "companyName")
//       .populate("assignedServiceEngineer", "name");

//     const pdfBuffer = await generateServiceReportPDF(populatedJob, {
//       companyAddress:
//         "426, NH 58, Gayatri Garden Partapur Bypass, Meerut, U.P.",
//       gstin: "09ABDC55295N1ZP",
//       state: "Uttar Pradesh",
//       salesPhone: "9760730500",
//       supportPhone: "9012665500, 9012665543",
//       trackUrl: `https://yourapp.com/track/${populatedJob.complaintNumber}`,
//       payUrl: `https://yourapp.com/pay/${populatedJob._id}`,
//     });

//     const customerEmail =
//       populatedJob.customer?.email || "tanjil113355@gmail.com";

//     const total =
//       (populatedJob.serviceCharge || 0) - (populatedJob.discount || 0);
//     const receivedAmount = populatedJob.receivedAmount || 0;
//     const balanceAmount = total - receivedAmount;

//     const html = `
// <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b; font-size: 14px; line-height: 1.6;">
//   <p style="margin: 0 0 4px;">Dear <strong>${(populatedJob.customer?.name || "Customer").toUpperCase()}</strong>,</p>
//   <p style="margin: 0 0 16px;">Your Complaint has been Solved, Please find below all details,</p>

//   <p style="margin: 0;">Date : <strong>${new Date(populatedJob.solveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong></p>
//   <p style="margin: 0;">Time : <strong>${new Date(populatedJob.solveDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</strong></p>
//   <p style="margin: 0;">Comp. No : <strong>${populatedJob.complaintNumber}</strong></p>
//   <p style="margin: 0;">Category : <strong>${(populatedJob.product || "-").toUpperCase()}</strong></p>
//   <p style="margin: 0;">Product : <strong>${populatedJob.product || "-"}</strong></p>
//   <p style="margin: 0;">Status : <strong>${populatedJob.status}</strong></p>
//   <p style="margin: 0;">Technician Name : <strong>${populatedJob.assignedServiceEngineer?.name || "-"}</strong></p>
//   <p style="margin: 0;">Technician Remark : <strong>${populatedJob.correctiveActionTaken || "work done"}</strong></p>
//   <p style="margin: 0;">Closed Date : <span style="color: #16a34a; font-weight: bold;">${new Date(populatedJob.solveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").join("-")} ${new Date(populatedJob.solveDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span></p>
//   <p style="margin: 0;">Total Amount : <span style="color: #16a34a; font-weight: bold;">${total.toFixed(2)}</span></p>
//   <p style="margin: 0;">Received Amount : <span style="color: #16a34a; font-weight: bold;">${receivedAmount.toFixed(2)}</span></p>
//   <p style="margin: 0 0 16px;">Balance Amount : <span style="color: #16a34a; font-weight: bold;">${balanceAmount.toFixed(2)}</span></p>

//   <p style="margin: 0;">Thank you,</p>
//   <p style="margin: 0;"><strong>${populatedJob.company?.companyName || "Service Team"}</strong>,</p>
//   <p style="margin: 0;">Helpline No.-${populatedJob.company?.supportPhone || "-"}</p>
// </div>
// `;

//     const text = `Dear ${(populatedJob.customer?.name || "Customer").toUpperCase()},
// Your Complaint has been Solved, Please find below all details,

// Date : ${new Date(populatedJob.solveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
// Time : ${new Date(populatedJob.solveDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
// Comp. No : ${populatedJob.complaintNumber}
// Category : ${(populatedJob.product || "-").toUpperCase()}
// Product : ${populatedJob.product || "-"}
// Status : ${populatedJob.status}
// Technician Name : ${populatedJob.assignedServiceEngineer?.name || "-"}
// Technician Remark : ${populatedJob.correctiveActionTaken || "work done"}
// Closed Date : ${new Date(populatedJob.solveDate).toLocaleString()}
// Total Amount : ${total.toFixed(2)}
// Received Amount : ${receivedAmount.toFixed(2)}
// Balance Amount : ${balanceAmount.toFixed(2)}

// Thank you,
// ${populatedJob.company?.companyName || "Service Team"},
// Helpline No.-${populatedJob.company?.supportPhone || "-"}`;

//     await sendEmail(
//       customerEmail,
//       `Complaint-${populatedJob.complaintNumber}`,
//       {
//         html,
//         text,
//         attachments: [
//           {
//             filename: `Complaint-${populatedJob.complaintNumber}.pdf`,
//             content: pdfBuffer,
//           },
//         ],
//       },
//     );

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
