const mongoose = require("mongoose");

const JobCategorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "HoldSubStatus",
        "ActualIssue",
        "CorrectiveAction",
        "JobSource", // NEW
        "CallType", // NEW
        "NatureOfWork", // NEW
      ],
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// prevent duplicate labels within the same company + type
JobCategorySchema.index({ type: 1, label: 1 }, { unique: true });

const JobCategory = mongoose.model("JobCategory", JobCategorySchema);

module.exports = JobCategory;
