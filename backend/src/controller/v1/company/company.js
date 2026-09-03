const Job = require("../../../models/Job");
const Customer = require("../../../models/Customer");
const ServiceCenter = require("../../../models/ServiceCenter");
const ServiceEngineer = require("../../../models/ServiceEngineer");
const bcrypt = require("bcrypt");

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
      complaintDate,
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
      complaintDate: complaintDate || Date.now(),
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

    console.log(customers);

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
      .select("complaintNumber complaintDate product status")
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
