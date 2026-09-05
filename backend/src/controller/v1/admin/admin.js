const bcrypt = require("bcrypt");
const Company = require("../../../models/Company");
const jwt = require("jsonwebtoken");
const User = require("../../../models/User");

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
    creationDate,
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
      creationDate: creationDate || Date.now(),
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
      userName: company.username,
      companyName: company.companyName,
      gstNumber: company.gstNumber,
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
