const bcrypt = require("bcrypt");
const Company = require("../../../models/Company");
const jwt = require("jsonwebtoken");
const User = require("../../../models/User");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const ServiceCenter = require("../../../models/ServiceCenter");
const Job = require("../../../models/Job");
const JobCategory = require("../../../models/JobCategory");

// POST /api/companies
exports.createCompany = async (req, res) => {
  const {
    companyName,
    address,
    contactPerson,
    contactNumber,
    gstNumber,
    username,
    password,
    subscriptionFrom,
    subscriptionTo,
    status,
  } = req.body;

  if (
    !companyName ||
    !address ||
    !contactPerson ||
    !contactNumber ||
    !gstNumber ||
    !username ||
    !password ||
    !subscriptionFrom ||
    !subscriptionTo
  ) {
    return res.status(400).json({ status: "error", message: "Invalid input" });
  }

  let existing;
  try {
    existing = await Company.findOne({
      $or: [{ username }, { gstNumber }],
    });
  } catch (e) {
    return res
      .status(500)
      .json({ status: "error", message: "error while reading database" });
  }

  if (existing) {
    return res.status(409).json({
      status: "error",
      message: "a company with this username or GST number already exists",
    });
  }

  let company;
  try {
    company = await Company.create({
      companyName,
      address,
      contactPerson,
      contactNumber,
      gstNumber,
      username,
      password: await bcrypt.hash(password, 10),
      creationDate: Date.now(),
      subscriptionPlan: {
        fromDate: subscriptionFrom,
        toDate: subscriptionTo,
      },
      status: status || "Active",
    });
  } catch (e) {
    return res
      .status(500)
      .json({ status: "error", message: "error while creating company" });
  }

  const result = company.toObject();
  delete result.password;

  res.status(201).json({
    status: "success",
    message: "company created successfully",
    company: result,
    success: true,
  });
};

// GET /api/companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "success", companies, success: true });
  } catch (e) {
    res
      .status(500)
      .json({ status: "error", message: "error while reading database" });
  }
};

// GET /api/companies/:id
exports.getCompanyById = async (req, res) => {
  const { id } = req.params;

  let company;
  try {
    company = await Company.findById(id);
  } catch (e) {
    return res
      .status(404)
      .json({ status: "error", message: "error while reading database" });
  }

  if (!company) {
    return res
      .status(404)
      .json({ status: "error", message: "company not found" });
  }

  res.status(200).json({ status: "success", company, success: true });
};

// PATCH /api/companies/:id
exports.updateCompany = async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    address,
    contactPerson,
    contactNumber,
    gstNumber,
    username,
    password,
    subscriptionFrom,
    subscriptionTo,
    status,
  } = req.body;

  const updateFields = {
    ...(companyName && { companyName }),
    ...(address && { address }),
    ...(contactPerson && { contactPerson }),
    ...(contactNumber && { contactNumber }),
    ...(gstNumber && { gstNumber }),
    ...(username && { username }),
    ...(status && { status }),
  };

  if (subscriptionFrom || subscriptionTo) {
    let existing;
    try {
      existing = await Company.findById(id);
    } catch (e) {
      return res
        .status(404)
        .json({ status: "error", message: "error while reading database" });
    }
    if (!existing) {
      return res
        .status(404)
        .json({ status: "error", message: "company not found" });
    }
    updateFields.subscriptionPlan = {
      fromDate: subscriptionFrom || existing.subscriptionPlan.fromDate,
      toDate: subscriptionTo || existing.subscriptionPlan.toDate,
    };
  }

  // Only touch the password if a new one was actually submitted
  if (password) {
    updateFields.password = await bcrypt.hash(password, 10);
  }

  let company;
  try {
    company = await Company.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true },
    );
  } catch (e) {
    return res
      .status(500)
      .json({ status: "error", message: "error while updating company" });
  }

  if (!company) {
    return res
      .status(404)
      .json({ status: "error", message: "company not found" });
  }

  res.status(200).json({
    status: "success",
    message: "company updated successfully",
    company,
    success: true,
  });
};

// DELETE /api/companies/:id
exports.deleteCompany = async (req, res) => {
  const { id } = req.params;

  let company;
  try {
    company = await Company.findByIdAndDelete(id);
  } catch (e) {
    return res
      .status(500)
      .json({ status: "error", message: "error while deleting company" });
  }

  if (!company) {
    return res
      .status(404)
      .json({ status: "error", message: "company not found" });
  }

  res.status(200).json({
    status: "success",
    message: "company deleted successfully",
    success: true,
  });
};

exports.companyLogin = async (req, res, next) => {
  try {
    const { companyId } = req.params || "";
    if (!companyId) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide companyId" });
    }

    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      return res
        .status(400)
        .send({ status: false, message: "company not found" });
    }

    const payload = {
      id: company._id,
      name: company.companyName,
      role: "company",
      username: company.username,
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 60 * 60 * 24 * 60 },
      (err, token) => {
        if (err) return res.status(500).json({ token: "Error signing token." });
        res.status(200).json({ token, company: payload, success: true });
      },
    );

    // use appropriate status code to send data
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  const { name, email, password, phone } = req.body || {};

  // Basic validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .send({ message: "Please provide all required fields" });
  }

  try {
    // Check for existing email with the same rol
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(201).send({
        success: false,
        message: `user of  ${name} already registered!`,
      });
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      role: "admin",
    });
    const savedUser = await newUser.save();

    res.status(201).send({
      success: true,
      message: "User registered successfully!",
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    // Check for existing email with the same rol
    const users = await User.find({});
    res.status(201).send({
      success: true,
      message: "Users!",
      data: users,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, password } = req.body || {};

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const updateFields = {
      ...(name && { name }),
      ...(phone && { phone }),
    };

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateUser error:", error);
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    // Check for existing email with the same rol
    const id = req.params.id;
    await User.findByIdAndDelete(id);
    res.status(201).send({
      success: true,
      message: "User deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// GET /service-center/getProfile
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await User.findById(req.user._id).select("-password");
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
    const { name, address, phone } = req.body;

    const updateFields = {
      ...(name && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
    };

    const profile = await User.findByIdAndUpdate(
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
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "newPassword must be at least 6 characters",
      });
    }

    const admin = await User.findById(req.user._id).select("+password");
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    admin.password = newPassword; // pre-save hook hashes it
    await admin.save();

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

exports.getDashboardStats = async (req, res) => {
  try {
    const OPEN_STATUSES = [
      "Registered",
      "Service Center Assigned",
      "Service Engineer Assigned",
      "Hold",
    ];

    const [
      totalCompanies,
      activeCompanies,
      inactiveCompanies, // was suspendedCompanies / "Suspended"
      totalComplaints,
      pendingComplaints,
      completedComplaints,
    ] = await Promise.all([
      Company.countDocuments({}),
      Company.countDocuments({ status: "Active" }),
      Company.countDocuments({ status: "Inactive" }),
      Job.countDocuments({}),
      Job.countDocuments({ status: { $in: OPEN_STATUSES } }),
      Job.countDocuments({ status: "Completed" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: inactiveCompanies,
        },
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          completed: completedComplaints,
        },
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

// GET /api/admin/getServiceCenters   query: { company, status, search }
exports.getServiceCenters = async (req, res) => {
  try {
    const { company, status, search } = req.query;
    const filter = {};
    if (company) filter.company = company;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const serviceCenters = await ServiceCenter.find(filter)
      .select("-password")
      .populate("company", "companyName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: serviceCenters });
  } catch (error) {
    console.error("getServiceCenters error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service centers",
      error: error.message,
    });
  }
};

// GET /api/admin/getServiceEngineers   query: { company, serviceCenter, status, search }
exports.getServiceEngineers = async (req, res) => {
  try {
    const { company, serviceCenter, status, search } = req.query;
    const filter = {};
    if (company) filter.company = company;
    if (serviceCenter) filter.serviceCenter = serviceCenter;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const engineers = await ServiceEngineer.find(filter)
      .select("-password")
      .populate("company", "companyName")
      .populate("serviceCenter", "name")
      .sort({ createdAt: -1 });

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

// GET /api/admin/getCompaniesLookup — for the filter dropdowns on both list pages
exports.getCompaniesLookup = async (req, res) => {
  try {
    const companies = await Company.find({}).select("name").sort({ name: 1 });
    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error("getCompaniesLookup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
      error: error.message,
    });
  }
};

const VALID_TYPES = ["HoldSubStatus", "ActualIssue", "CorrectiveAction"];

exports.listJobCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid type" });
      }
      filter.type = type;
    }

    // non-admin callers (e.g. the status-update modal) only need active ones
    if (req.query.activeOnly === "true") filter.isActive = true;

    const categories = await JobCategory.find(filter).sort({
      type: 1,
      order: 1,
      label: 1,
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createJobCategory = async (req, res) => {
  try {
    const { type, label, order } = req.body;
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    if (!label?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Label is required" });
    }

    const category = await JobCategory.create({
      type,
      label: label.trim(),
      order: order || 0,
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This label already exists for this category.",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateJobCategory = async (req, res) => {
  try {
    const { label, isActive, order } = req.body;
    const update = {};
    if (label !== undefined) update.label = label.trim();
    if (isActive !== undefined) update.isActive = isActive;
    if (order !== undefined) update.order = order;

    const category = await JobCategory.findOneAndUpdate(
      { _id: req.params.id },
      update,
      { new: true, runValidators: true },
    );
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.json({ success: true, data: category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This label already exists for this category.",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJobCategory = async (req, res) => {
  try {
    const category = await JobCategory.findOneAndDelete({
      _id: req.params.id,
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
