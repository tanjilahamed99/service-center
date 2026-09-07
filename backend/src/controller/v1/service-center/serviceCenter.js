const Job = require("../../../models/Job");
const Customer = require("../../../models/Customer");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const bcrypt = require("bcrypt");

exports.serviceCenterJobs = async (req, res) => {
  try {
    const assignedServiceCenter = req.user._id;
    const {
      search,
      status,
      callType,
      natureOfWork,
      serviceEngineer,
      sortDesc,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { assignedServiceCenter };
    if (status) filter.status = status;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;
    if (serviceEngineer) filter.assignedServiceEngineer = serviceEngineer;

    if (search) {
      const matchingCustomers = await Customer.find({
        company,
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

// GET /api/service-engineer/getProfile
exports.getMyProfile = async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.user._id);

    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({ success: true, data: center });
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
    const { name, contactNumber, contactPerson, username, gstNumber, address } =
      req.body;

    if (!name || !username) {
      return res
        .status(400)
        .json({ success: false, message: "name and username are required" });
    }

    if (username) {
      const clash = await ServiceCenter.findOne({
        _id: { $ne: req.user._id },
        username,
      });
      if (clash) {
        return res
          .status(409)
          .json({ success: false, message: "Username already in use" });
      }
    }

    const center = await ServiceCenter.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name,
          contactNumber,
          contactPerson,
          username,
          gstNumber,
          address,
        },
      },
      { new: true, runValidators: true },
    );

    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile updated", data: center });
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

    const center = await ServiceCenter.findById(req.user._id).select(
      "+password",
    );
    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const isMatch = await center.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    center.password = newPassword;
    await center.save();

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
