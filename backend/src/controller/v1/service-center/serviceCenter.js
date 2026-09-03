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
