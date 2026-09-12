const Job = require("../../../models/Job");
const Customer = require("../../../models/Customer");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const bcrypt = require("bcrypt");
const Company = require("../../../models/Company");
const Product = require("../../../models/Products");
const SparePartTransaction = require("../../../models/SparePartTransaction");
const SparePartStock = require("../../../models/SparePartStock");
const SparePart = require("../../../models/SpareParts");
const JobCategory = require("../../../models/JobCategory");
const jwt = require("jsonwebtoken");

// Base path assumed: /api/companies  (adjust if mounted elsewhere)
// req.user is assumed to be set by your auth middleware, with req.user._id
// being the logged-in company's ObjectId. Swap `req.user._id` below for
// whatever your middleware actually attaches if it's named differently.

// ============ Jobs ============

// POST /api/companies/createJob
// body: { customer, jobSource, complaintDate, callType, natureOfWork, approxCost,
//         brand, product, modelNumber, serialNumber, warrantyFrom, warrantyTo,
//         assignedServiceCenter, scheduleDate, uploadFile }
exports.createJob = async (req, res) => {
  try {
    const company = req.user._id;
    const {
      customer,
      jobSource,
      callType,
      natureOfWork,
      approxCost,
      brand,
      product,
      modelNumber,
      serialNumber,
      warrantyFrom,
      warrantyTo,
      assignedServiceCenter,
      scheduleDate,
      uploadFile,
      remark,
    } = req.body;

    if (!customer || !jobSource || !callType || !natureOfWork) {
      return res.status(400).json({
        success: false,
        message: "customer, jobSource, callType and natureOfWork are required",
      });
    }

    const customerExists = await Customer.findOne({ _id: customer, company });
    if (!customerExists) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Simple sequential complaint number, scoped per company.
    // NOTE: under concurrent writes this can theoretically collide — swap for an
    // atomic counter collection (findOneAndUpdate with $inc) if that matters to you.
    const jobCount = await Job.countDocuments();
    const complaintNumber = `CMP-${String(jobCount + 1).padStart(6, "0")}`;

    const job = await Job.create({
      company,
      customer,
      complaintNumber,
      jobSource,
      callType,
      natureOfWork,
      approxCost,
      brand,
      product,
      modelNumber,
      serialNumber,
      warrantyFrom,
      warrantyTo,
      assignedServiceCenter: assignedServiceCenter || undefined,
      scheduleDate,
      assignedAt: assignedServiceCenter ? Date.now() : undefined,
      status: assignedServiceCenter ? "Service Center Assigned" : "Registered",
      uploadFile,
      remark: remark || "",
      logs: [
        {
          at: Date.now(),
          actor: req.user.name || "Company Admin",
          action: `Job ${complaintNumber} registered`,
        },
      ],
    });

    return res
      .status(201)
      .json({ success: true, message: "Job created", data: job });
  } catch (error) {
    console.error("createJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
};

// GET /api/companies/getJobs
// query: { search, status, callType, natureOfWork, serviceCenter, serviceEngineer,
//          sortDesc, page, limit }
exports.getJobs = async (req, res) => {
  try {
    const company = req.user._id;
    const {
      search,
      status,
      callType,
      natureOfWork,
      serviceCenter,
      serviceEngineer,
      sortDesc,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { company };
    if (status) filter.status = status;
    if (callType) filter.callType = callType;
    if (natureOfWork) filter.natureOfWork = natureOfWork;
    if (serviceCenter) filter.assignedServiceCenter = serviceCenter;
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

// GET /api/companies/getJobById/:id
exports.getJobById = async (req, res) => {
  try {
    const company = req.user._id;
    const job = await Job.findOne({ _id: req.params.id, company })
      .populate("customer", "name mobileNumber alternateNumber address")
      .populate("assignedServiceCenter", "name contactNumber")
      .populate("assignedServiceEngineer", "name contactNumber");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("getJobById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

// PUT /api/companies/updateJob/:id
// body: any editable Create Job field (job source, product details, call type, etc.)
exports.updateJob = async (req, res) => {
  try {
    const company = req.user._id;

    // Fields that must never be changed through this endpoint.
    const {
      company: _c,
      customer: _cu,
      complaintNumber: _cn,
      status: _s,
      logs: _l,
      ...updates
    } = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Job updated", data: job });
  } catch (error) {
    console.error("updateJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
};

// POST /api/companies/assignJob
// body: { jobIds: [ObjectId], serviceCenter: ObjectId, scheduleDate, note }
exports.assignJob = async (req, res) => {
  try {
    const company = req.user._id;
    const { jobIds, serviceCenter, scheduleDate, note } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0 || !serviceCenter) {
      return res.status(400).json({
        success: false,
        message: "jobIds (array) and serviceCenter are required",
      });
    }

    const center = await ServiceCenter.findOne({ _id: serviceCenter, company });
    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Service center not found" });
    }

    const logAction = `Assigned to ${center.name}${note ? ` — ${note}` : ""}`;

    const result = await Job.updateMany(
      { _id: { $in: jobIds }, company },
      {
        $set: {
          assignedServiceCenter: serviceCenter,
          scheduleDate: scheduleDate || undefined,
          assignedAt: Date.now(),
          status: "Service Center Assigned",
        },
        $push: {
          logs: {
            at: Date.now(),
            actor: req.user.name || "Company Admin",
            action: logAction,
          },
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} job(s) assigned to ${center.name}`,
      data: result,
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

// PUT /api/companies/holdJob/:id
// body: { holdSubStatus, holdReason, holdPhotos: [String] (2–5), holdRemarks }
exports.holdJob = async (req, res) => {
  try {
    const company = req.user._id;
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

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company },
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
            actor: req.user.name || "Service Engineer",
            action: `Marked on hold — ${holdSubStatus}${holdReason ? `: ${holdReason}` : ""}`,
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

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

// PUT /api/companies/closeJob/:id
// body: { consumedParts, sparesTotal, serviceCharge, discount, actualIssueFound,
//         correctiveActionTaken, closurePhotos, customerSignature, otp }
exports.closeJob = async (req, res) => {
  try {
    const company = req.user._id;
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

    // TODO: verify `otp` against whatever OTP flow you send the customer (SMS provider, etc.)
    // before flipping closureOtpVerified to true. Rejecting here for now if it's missing.
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required to close the job" });
    }

    const sparesTotal = consumedParts.reduce(
      (sum, part) => sum + (Number(part.quantity) || 0),
      0,
    );

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company },
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
            actor: req.user.name || "Service Engineer",
            action: "Job closed",
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

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

// PUT /api/companies/cancelJob/:id
// body: { reason }
exports.cancelJob = async (req, res) => {
  try {
    const company = req.user._id;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "A cancellation reason is required" });
    }

    const existing = await Job.findOne({ _id: req.params.id, company });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    if (existing.status !== "Registered") {
      return res.status(400).json({
        success: false,
        message: `Only Registered jobs can be cancelled (current status: ${existing.status})`,
      });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company },
      {
        $set: {
          status: "Cancelled",
          cancelReason: reason,
          cancelledBy: req.user._id,
          cancelledAt: Date.now(),
        },
        $push: {
          logs: {
            at: Date.now(),
            actor: req.user.name || "Company Admin",
            action: `Cancelled — ${reason}`,
          },
        },
      },
      { new: true, runValidators: true },
    );

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

// GET /api/companies/getJobLogs/:id
exports.getJobLogs = async (req, res) => {
  try {
    const company = req.user._id;
    const job = await Job.findOne({ _id: req.params.id, company }).select(
      "complaintNumber logs",
    );

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

// ============ Customers ============

// GET /api/companies/searchCustomers
// query: { search }
exports.searchCustomers = async (req, res) => {
  try {
    const company = req.user._id;
    const { search } = req.query;

    if (!search) {
      return res.status(200).json({ success: true, data: [] });
    }

    const customers = await Customer.find({
      company,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ],
    }).limit(10);

    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error("searchCustomers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search customers",
      error: error.message,
    });
  }
};

// POST /api/companies/createCustomer
// body: { name, mobileNumber, alternateNumber, address }
exports.createCustomer = async (req, res) => {
  try {
    const company = req.user._id;
    const { name, mobileNumber, address } = req.body;

    if (!name || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "name and mobileNumber are required",
      });
    }

    const existing = await Customer.findOne({ company, mobileNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A customer with this mobile number already exists",
        data: existing,
      });
    }

    const customer = await Customer.create({
      company,
      name,
      mobileNumber,
      address,
    });

    return res
      .status(201)
      .json({ success: true, message: "Customer created", data: customer });
  } catch (error) {
    console.error("createCustomer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
};

// GET /api/companies/getCustomerPreviousJobs/:customerId
exports.getCustomerPreviousJobs = async (req, res) => {
  try {
    const company = req.user._id;
    const { customerId } = req.params;

    const customer = await Customer.findOne({ _id: customerId, company });
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const jobs = await Job.find({ company, customer: customerId })
      .select(
        "complaintNumber complaintDate product status correctiveActionTaken",
      )
      .sort({ complaintDate: -1 });

    return res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error("getCustomerPreviousJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch previous jobs",
      error: error.message,
    });
  }
};

// ============ Lookups ============

// GET /api/companies/getServiceCenters
exports.getServiceCenters = async (req, res) => {
  try {
    const company = req.user._id;
    const serviceCenters = await ServiceCenter.find({
      company,
    }).select("-password");

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

// GET /api/companies/getServiceEngineers
// query: { serviceCenter } (optional)
exports.getServiceEngineers = async (req, res) => {
  try {
    const company = req.user._id;
    const { serviceCenter } = req.query;

    const filter = { company };
    if (serviceCenter) filter.serviceCenter = serviceCenter;

    const engineers = await ServiceEngineer.find(filter)
      .select("-password")
      .populate("serviceCenter", "name");

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

// GET /getServiceCenterById/:id
exports.getServiceCenterById = async (req, res) => {
  try {
    const company = req.user._id;
    const serviceCenter = await ServiceCenter.findOne({
      _id: req.params.id,
      company,
    }).select("-password");
    if (!serviceCenter) {
      return res
        .status(404)
        .json({ success: false, message: "Service center not found" });
    }

    return res.status(200).json({ success: true, data: serviceCenter });
  } catch (error) {
    console.error("getServiceCenterById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service center",
      error: error.message,
    });
  }
};

// POST /createServiceCenter
// body: { name, address, contactPerson, contactNumber, gstNumber, username, password }
exports.createServiceCenter = async (req, res) => {
  try {
    const company = req.user._id;
    const {
      name,
      address,
      contactPerson,
      contactNumber,
      gstNumber,
      username,
      password,
    } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "name, username and password are required",
      });
    }

    const existing = await ServiceCenter.findOne({ company, username });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A service center with this username already exists",
      });
    }

    // password hashing happens in the model's pre("save") hook
    const serviceCenter = await ServiceCenter.create({
      company,
      name,
      address,
      contactPerson,
      contactNumber,
      gstNumber,
      username,
      password,
    });

    const { password: _pw, ...safe } = serviceCenter.toObject();
    return res
      .status(201)
      .json({ success: true, message: "Service center created", data: safe });
  } catch (error) {
    console.error("createServiceCenter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create service center",
      error: error.message,
    });
  }
};

// PUT /updateServiceCenter/:id
// body: any editable field. Include `password` only if the company wants to change it.
exports.updateServiceCenter = async (req, res) => {
  try {
    const company = req.user._id;
    const { company: _c, password, ...updates } = req.body;

    // findOneAndUpdate skips the model's pre("save") hash hook, so hash manually.
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const serviceCenter = await ServiceCenter.findOneAndUpdate(
      { _id: req.params.id, company },
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!serviceCenter) {
      return res
        .status(404)
        .json({ success: false, message: "Service center not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Service center updated",
      data: serviceCenter,
    });
  } catch (error) {
    console.error("updateServiceCenter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update service center",
      error: error.message,
    });
  }
};

// DELETE /deleteServiceCenter/:id
exports.deleteServiceCenter = async (req, res) => {
  try {
    const company = req.user._id;

    const hasJobs = await Job.exists({
      company,
      assignedServiceCenter: req.params.id,
    });
    if (hasJobs) {
      return res.status(409).json({
        success: false,
        message:
          "This service center has jobs assigned to it and can't be deleted — set it to Inactive instead.",
      });
    }
    const hasEngineers = await ServiceEngineer.exists({
      company,
      serviceCenter: req.params.id,
    });
    if (hasEngineers) {
      return res.status(409).json({
        success: false,
        message:
          "This service center still has service engineers under it — reassign or remove them first.",
      });
    }

    const deleted = await ServiceCenter.findOneAndDelete({
      _id: req.params.id,
      company,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Service center not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Service center deleted" });
  } catch (error) {
    console.error("deleteServiceCenter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete service center",
      error: error.message,
    });
  }
};

// ============ Service Engineers ============

// GET /getServiceEngineerById/:id
exports.getServiceEngineerById = async (req, res) => {
  try {
    const company = req.user._id;
    const engineer = await ServiceEngineer.findOne({
      _id: req.params.id,
      company,
    })
      .select("-password")
      .populate("serviceCenter", "name");

    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Service engineer not found" });
    }
    return res.status(200).json({ success: true, data: engineer });
  } catch (error) {
    console.error("getServiceEngineerById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service engineer",
      error: error.message,
    });
  }
};

// POST /createServiceEngineer
// body: { serviceCenter, name, contactNumber, aadharNumber, username, password }
exports.createServiceEngineer = async (req, res) => {
  try {
    const company = req.user._id;
    const {
      serviceCenter,
      name,
      contactNumber,
      aadharNumber,
      username,
      password,
    } = req.body;

    if (!serviceCenter || !name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "serviceCenter, name, username and password are required",
      });
    }

    const centerExists = await ServiceCenter.findOne({
      _id: serviceCenter,
      company,
    });
    if (!centerExists) {
      return res
        .status(404)
        .json({ success: false, message: "Service center not found" });
    }

    const existing = await ServiceEngineer.findOne({ company, username });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A service engineer with this username already exists",
      });
    }

    const engineer = await ServiceEngineer.create({
      company,
      serviceCenter,
      name,
      contactNumber,
      aadharNumber,
      username,
      password,
    });

    const { password: _pw, ...safe } = engineer.toObject();
    return res
      .status(201)
      .json({ success: true, message: "Service engineer created", data: safe });
  } catch (error) {
    console.error("createServiceEngineer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create service engineer",
      error: error.message,
    });
  }
};

// PUT /updateServiceEngineer/:id
exports.updateServiceEngineer = async (req, res) => {
  try {
    const company = req.user._id;
    const { company: _c, password, ...updates } = req.body;

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const engineer = await ServiceEngineer.findOneAndUpdate(
      { _id: req.params.id, company },
      { $set: updates },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate("serviceCenter", "name");

    if (!engineer) {
      return res
        .status(404)
        .json({ success: false, message: "Service engineer not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Service engineer updated",
      data: engineer,
    });
  } catch (error) {
    console.error("updateServiceEngineer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update service engineer",
      error: error.message,
    });
  }
};

// DELETE /deleteServiceEngineer/:id
exports.deleteServiceEngineer = async (req, res) => {
  try {
    const company = req.user._id;

    const hasJobs = await Job.exists({
      company,
      assignedServiceEngineer: req.params.id,
    });
    if (hasJobs) {
      return res.status(409).json({
        success: false,
        message:
          "This service engineer has jobs assigned to them and can't be deleted — set them to Inactive instead.",
      });
    }

    const deleted = await ServiceEngineer.findOneAndDelete({
      _id: req.params.id,
      company,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Service engineer not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Service engineer deleted" });
  } catch (error) {
    console.error("deleteServiceEngineer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete service engineer",
      error: error.message,
    });
  }
};

// GET /service-center/getProfile
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await Company.findById(req.user._id).select("-password");
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

    const profile = await Company.findByIdAndUpdate(
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

    const company = await Company.findById(req.user._id).select("+password");
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const isMatch = await company.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    company.password = newPassword; // pre-save hook hashes it
    await company.save();

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

// GET /api/companies/getDashboardStats
exports.getDashboardStats = async (req, res) => {
  try {
    const company = req.user._id;
    const now = new Date();
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // "Pending" for aging purposes = not yet Completed or Cancelled.
    const OPEN_STATUSES = [
      "Registered",
      "Service Center Assigned",
      "Service Engineer Assigned",
      "Hold",
    ];

    const [
      totalJobs,
      registeredJobs,
      pendingAtServiceCenter,
      pendingAtServiceEngineer,
      jobsOnHold,
      completedJobs,
      agingOverOneDay,
      agingOverThreeDays,
      agingOverSevenDays,
      totalServiceCenters,
      activeServiceCenters,
      totalServiceEngineers,
      activeServiceEngineers,
    ] = await Promise.all([
      Job.countDocuments({ company }),
      Job.countDocuments({ company, status: "Registered" }),
      Job.countDocuments({ company, status: "Service Center Assigned" }),
      Job.countDocuments({ company, status: "Service Engineer Assigned" }),
      Job.countDocuments({ company, status: "Hold" }),
      Job.countDocuments({ company, status: "Completed" }),
      Job.countDocuments({
        company,
        status: { $in: OPEN_STATUSES },
        complaintDate: { $lte: oneDayAgo },
      }),
      Job.countDocuments({
        company,
        status: { $in: OPEN_STATUSES },
        complaintDate: { $lte: threeDaysAgo },
      }),
      Job.countDocuments({
        company,
        status: { $in: OPEN_STATUSES },
        complaintDate: { $lte: sevenDaysAgo },
      }),
      ServiceCenter.countDocuments({ company }),
      ServiceCenter.countDocuments({ company, status: "Active" }),
      ServiceEngineer.countDocuments({ company }),
      ServiceEngineer.countDocuments({ company, status: "Active" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        jobs: {
          total: totalJobs,
          registered: registeredJobs,
          pendingAtServiceCenter,
          pendingAtServiceEngineer,
          onHold: jobsOnHold,
          completed: completedJobs,
        },
        aging: {
          overOneDay: agingOverOneDay,
          overThreeDays: agingOverThreeDays,
          overSevenDays: agingOverSevenDays,
        },
        serviceCenters: {
          total: totalServiceCenters,
          active: activeServiceCenters,
        },
        serviceEngineers: {
          total: totalServiceEngineers,
          active: activeServiceEngineers,
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

// POST /company/products
exports.createProduct = async (req, res) => {
  try {
    const company = req.user._id;
    const { brand, productName, model, status } = req.body;

    if (!brand || !productName || !model) {
      return res.status(400).json({
        success: false,
        message: "brand, productName and model are required",
      });
    }

    const existing = await Product.findOne({
      company,
      brand,
      productName,
      model,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This Brand / Product / Model combination already exists",
      });
    }

    const product = await Product.create({
      company,
      brand,
      productName,
      model,
      status: status || "Active",
    });

    return res
      .status(201)
      .json({ success: true, message: "Product created", data: product });
  } catch (error) {
    console.error("createProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// GET /company/products?brand=&productName=&status=&search=
exports.getProducts = async (req, res) => {
  try {
    const company = req.user._id;
    const { brand, productName, status, search } = req.query;

    const filter = { company };
    if (brand) filter.brand = brand;
    if (productName) filter.productName = productName;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({
      brand: 1,
      productName: 1,
      model: 1,
    });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("getProducts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// GET /company/products/:id
exports.getProductById = async (req, res) => {
  try {
    const company = req.user._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, company });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("getProductById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// PUT /company/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const company = req.user._id;
    const { id } = req.params;
    const { brand, productName, model, status } = req.body;

    if (brand || productName || model) {
      const current = await Product.findOne({ _id: id, company });
      if (!current) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const duplicate = await Product.findOne({
        company,
        brand: brand || current.brand,
        productName: productName || current.productName,
        model: model || current.model,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "This Brand / Product / Model combination already exists",
        });
      }
    }

    const updateFields = {
      ...(brand && { brand }),
      ...(productName && { productName }),
      ...(model && { model }),
      ...(status && { status }),
    };

    const product = await Product.findOneAndUpdate(
      { _id: id, company },
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Product updated", data: product });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// DELETE /company/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const company = req.user._id;
    const { id } = req.params;

    const product = await Product.findOneAndDelete({ _id: id, company });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("deleteProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

exports.createSparePart = async (req, res) => {
  try {
    const company = req.user._id;
    const {
      brand,
      product,
      modelNumber,
      spareName,
      category,
      unit,
      initialQuantity = 0,
    } = req.body;

    if (!brand || !product || !spareName) {
      return res.status(400).json({
        success: false,
        message: "brand, product and spareName are required",
      });
    }

    const sparePart = await SparePart.create({
      company,
      brand,
      product,
      modelNumber,
      spareName,
      category,
      unit,
    });

    // Every spare part gets a Company-store stock row, even if it starts at 0.
    await SparePartStock.create({
      company,
      sparePart: sparePart._id,
      ownerType: "Company",
      ownerId: null,
      quantity: Math.max(0, Number(initialQuantity) || 0),
    });

    if (initialQuantity > 0) {
      await SparePartTransaction.create({
        company,
        sparePart: sparePart._id,
        type: "Restock",
        toType: "Company",
        toId: null,
        quantity: initialQuantity,
        note: "Initial stock",
        actor: req.user.name || "Company Admin",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Spare part created", data: sparePart });
  } catch (error) {
    console.error("createSparePart error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create spare part",
      error: error.message,
    });
  }
};

// GET /getSpareParts   query: { search, brand, category, status }
// Returns each spare part with its Company-store quantity attached, so the
// list page can show "on hand" without a second round trip.
exports.getSpareParts = async (req, res) => {
  try {
    const company = req.user._id;
    const { search, brand, category, status } = req.query;

    const filter = { company };
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { spareName: { $regex: search, $options: "i" } },
        { product: { $regex: search, $options: "i" } },
        { modelNumber: { $regex: search, $options: "i" } },
      ];
    }

    const spareParts = await SparePart.find(filter).sort({ createdAt: -1 });

    const stockRows = await SparePartStock.find({
      company,
      ownerType: "Company",
      sparePart: { $in: spareParts.map((s) => s._id) },
    });
    const stockBySparePart = Object.fromEntries(
      stockRows.map((r) => [r.sparePart.toString(), r.quantity]),
    );

    const data = spareParts.map((sp) => ({
      ...sp.toObject(),
      companyStock: stockBySparePart[sp._id.toString()] ?? 0,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getSpareParts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch spare parts",
      error: error.message,
    });
  }
};

// GET /getSparePartById/:id — includes full stock breakdown across every location
exports.getSparePartById = async (req, res) => {
  try {
    const company = req.user._id;
    const sparePart = await SparePart.findOne({ _id: req.params.id, company });
    if (!sparePart) {
      return res
        .status(404)
        .json({ success: false, message: "Spare part not found" });
    }

    const stock = await SparePartStock.find({
      company,
      sparePart: sparePart._id,
    }).populate("ownerId", "name");

    return res
      .status(200)
      .json({ success: true, data: { ...sparePart.toObject(), stock } });
  } catch (error) {
    console.error("getSparePartById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch spare part",
      error: error.message,
    });
  }
};

// PUT /updateSparePart/:id
exports.updateSparePart = async (req, res) => {
  try {
    const company = req.user._id;
    const { company: _c, ...updates } = req.body;

    const sparePart = await SparePart.findOneAndUpdate(
      { _id: req.params.id, company },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!sparePart) {
      return res
        .status(404)
        .json({ success: false, message: "Spare part not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Spare part updated", data: sparePart });
  } catch (error) {
    console.error("updateSparePart error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update spare part",
      error: error.message,
    });
  }
};

// DELETE /deleteSparePart/:id — blocked if any stock exists anywhere
exports.deleteSparePart = async (req, res) => {
  try {
    const company = req.user._id;

    const hasStock = await SparePartStock.exists({
      company,
      sparePart: req.params.id,
      quantity: { $gt: 0 },
    });
    if (hasStock) {
      return res.status(409).json({
        success: false,
        message:
          "This spare part still has stock somewhere — deallocate/consume it to zero first.",
      });
    }

    const deleted = await SparePart.findOneAndDelete({
      _id: req.params.id,
      company,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Spare part not found" });
    }
    await SparePartStock.deleteMany({ company, sparePart: req.params.id });

    return res
      .status(200)
      .json({ success: true, message: "Spare part deleted" });
  } catch (error) {
    console.error("deleteSparePart error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete spare part",
      error: error.message,
    });
  }
};

// ============ Stock movement ============

// POST /restockSparePart/:id
// body: { quantity, note }  — adds to the company's own central store
exports.restockSparePart = async (req, res) => {
  try {
    const company = req.user._id;
    const { quantity, note } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be a positive number",
      });
    }

    const sparePart = await SparePart.findOne({ _id: req.params.id, company });
    if (!sparePart) {
      return res
        .status(404)
        .json({ success: false, message: "Spare part not found" });
    }

    const stock = await SparePartStock.findOneAndUpdate(
      {
        company,
        sparePart: sparePart._id,
        ownerType: "Company",
        ownerId: null,
      },
      { $inc: { quantity } },
      { new: true, upsert: true },
    );

    await SparePartTransaction.create({
      company,
      sparePart: sparePart._id,
      type: "Restock",
      toType: "Company",
      toId: null,
      quantity,
      note,
      actor: req.user.companyName || "Company",
    });

    return res
      .status(200)
      .json({ success: true, message: "Restocked", data: stock });
  } catch (error) {
    console.error("restockSparePart error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restock",
      error: error.message,
    });
  }
};

// POST /allocateSparePart/:id
// body: { serviceCenter, quantity, note }
// Moves quantity from the company's central store to a service center's stock.
exports.allocateSparePart = async (req, res) => {
  try {
    const company = req.user._id;
    const { serviceCenter, quantity, note } = req.body;

    if (!serviceCenter || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "serviceCenter and a positive quantity are required",
      });
    }

    const [sparePart, center] = await Promise.all([
      SparePart.findOne({ _id: req.params.id, company }),
      ServiceCenter.findOne({ _id: serviceCenter, company }),
    ]);
    if (!sparePart)
      return res
        .status(404)
        .json({ success: false, message: "Spare part not found" });
    if (!center)
      return res
        .status(404)
        .json({ success: false, message: "Service center not found" });

    const companyStock = await SparePartStock.findOne({
      company,
      sparePart: sparePart._id,
      ownerType: "Company",
      ownerId: null,
    });
    if (!companyStock || companyStock.quantity < quantity) {
      return res.status(409).json({
        success: false,
        message: `Not enough stock in the central store (have ${companyStock?.quantity ?? 0}, need ${quantity}).`,
      });
    }

    // NOTE: these two updates aren't wrapped in a Mongo transaction — if you're
    // running a replica set, wrap this in a session for atomicity. On a
    // standalone Mongo instance, transactions aren't available at all.
    await SparePartStock.updateOne(
      {
        company,
        sparePart: sparePart._id,
        ownerType: "Company",
        ownerId: null,
      },
      { $inc: { quantity: -quantity } },
    );
    const centerStock = await SparePartStock.findOneAndUpdate(
      {
        company,
        sparePart: sparePart._id,
        ownerType: "ServiceCenter",
        ownerId: serviceCenter,
      },
      { $inc: { quantity } },
      { new: true, upsert: true },
    );

    await SparePartTransaction.create({
      company,
      sparePart: sparePart._id,
      type: "Allocate",
      fromType: "Company",
      fromId: null,
      toType: "ServiceCenter",
      toId: serviceCenter,
      quantity,
      note,
      actor: req.user.name || "Company Admin",
    });

    return res.status(200).json({
      success: true,
      message: `Allocated ${quantity} to ${center.name}`,
      data: centerStock,
    });
  } catch (error) {
    console.error("allocateSparePart error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to allocate",
      error: error.message,
    });
  }
};

// GET /getSparePartStock   query: { ownerType, ownerId } — e.g. a center's own on-hand list
exports.getSparePartStock = async (req, res) => {
  try {
    const company = req.user._id;
    const { ownerType = "Company", ownerId } = req.query;

    const filter = { company, ownerType };
    filter.ownerId = ownerType === "Company" ? null : ownerId;

    const stock = await SparePartStock.find(filter)
      .populate(
        "sparePart",
        "brand product modelNumber spareName category unit",
      )
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, data: stock });
  } catch (error) {
    console.error("getSparePartStock error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
      error: error.message,
    });
  }
};

// GET /getSparePartTransactions/:id — full audit trail for one spare part
exports.getSparePartTransactions = async (req, res) => {
  try {
    const company = req.user._id;
    const transactions = await SparePartTransaction.find({
      company,
      sparePart: req.params.id,
    })
      .populate("fromId", "name")
      .populate("toId", "name")
      .populate("job", "complaintNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("getSparePartTransactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

exports.getJobCategoryOptions = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "type is required" });
    }
    const items = await JobCategory.find({ type, isActive: true })
      .sort({ label: 1 })
      .select("label");
    return res
      .status(200)
      .json({ success: true, data: items.map((i) => i.label) });
  } catch (error) {
    console.error("getJobCategoryOptions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch options",
      error: error.message,
    });
  }
};

exports.serviceCenterLogin = async (req, res, next) => {
  try {
    const { id } = req.params || "";
    if (!id) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide id" });
    }

    const login = await ServiceCenter.findOne({
      _id: id,
      company: req.user._id,
    });

    if (!login) {
      return res
        .status(400)
        .send({ status: false, message: "service center not found" });
    }

    const payload = {
      id: login._id,
      name: login.name,
      role: "service-center",
      username: login.username,
      company: login.company,
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 60 * 60 * 24 * 60 },
      (err, token) => {
        if (err) return res.status(500).json({ token: "Error signing token." });
        res.status(200).json({ token, center: payload, success: true });
      },
    );

    // use appropriate status code to send data
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.serviceEngineerLogin = async (req, res, next) => {
  try {
    const { id } = req.params || "";
    if (!id) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide id" });
    }

    const login = await ServiceEngineer.findOne({
      _id: id,
      company: req.user._id,
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
