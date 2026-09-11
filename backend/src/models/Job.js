const mongoose = require("mongoose");

const JOB_STATUS = [
  "Registered",
  "Service Center Assigned",
  "Service Engineer Assigned",
  "Hold",
  "Completed",
  "Cancelled",
];


const ConsumedPartSchema = new mongoose.Schema(
  {
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart" }, // NEW — links to real inventory
    category: { type: String, trim: true },
    spareName: { type: String, trim: true },
    quantity: { type: Number, min: 1, default: 1 },
    remarks: { type: String, trim: true },
  },
  { _id: false },
);

const LogEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    actor: { type: String, trim: true }, // e.g. "Company Admin", "Service Engineer:<id>"
    action: { type: String, trim: true },
  },
  { _id: false },
);

const JobSchema = new mongoose.Schema(
  {
    // Ownership
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    // Identity
    complaintNumber: { type: String, required: true, unique: true }, // generate as e.g. `CMP-${seq}`
    complaintDate: { type: Date, default: Date.now },

    // Job details (Create Job form)
    jobSource: { type: String,  required: true },
    callType: { type: String, required: true },
    natureOfWork: { type: String, required: true },
    approxCost: { type: Number, min: 0 },

    // Product details
    brand: { type: String, trim: true },
    product: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    warrantyFrom: { type: Date },
    warrantyTo: { type: Date },

    // Assignment
    assignedServiceCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
    },
    assignedServiceEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceEngineer",
    },
    scheduleDate: { type: Date },
    assignedAt: { type: Date },

    // Lifecycle
    status: {
      type: String,
      enum: JOB_STATUS,
      default: "Registered",
      index: true,
    },
    solveDate: { type: Date },

    // Hold
    holdSubStatus: { type: String },
    holdReason: { type: String, trim: true },
    holdPhotos: [{ type: String }],
    holdRemarks: { type: String, trim: true },

    // Closure (Service Engineer "Closed" flow)
    consumedParts: [ConsumedPartSchema],
    sparesTotal: { type: Number, min: 0, default: 0 },
    serviceCharge: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    actualIssueFound: { type: String },
    correctiveActionTaken: { type: String },
    closurePhotos: [{ type: String }],
    customerSignature: { type: String }, // stored image/data URL path
    closureOtpVerified: { type: Boolean, default: false },

    // Cancellation
    cancelReason: { type: String, trim: true },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyUser" },
    cancelledAt: { type: Date },

    // Misc
    uploadFile: [{ type: String }], // path/URL of file attached at creation
    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

JobSchema.index({ company: 1, status: 1 });
JobSchema.index({ company: 1, assignedServiceCenter: 1 });
JobSchema.index({ company: 1, assignedServiceEngineer: 1 });

// TAT (turnaround time) is derived, not stored — compute from solveDate - complaintDate.
JobSchema.virtual("tatHours").get(function () {
  if (!this.solveDate) return null;
  return Math.round((this.solveDate - this.complaintDate) / (1000 * 60 * 60));
});

const Job = mongoose.model("Job", JobSchema);

module.exports = Job;
