const mongoose = require("mongoose");

const SparePartTransactionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    sparePart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SparePart",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Restock", "Allocate", "Return", "Consume"],
      required: true,
    },
    fromType: {
      type: String,
      enum: ["Company", "ServiceCenter", null],
      default: null,
    },
    fromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      default: null,
    },
    toType: {
      type: String,
      enum: ["Company", "ServiceCenter", null],
      default: null,
    },
    toId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      default: null,
    },
    quantity: { type: Number, required: true, min: 1 },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null }, // set for "Consume" transactions
    note: { type: String, trim: true },
    actor: { type: String, trim: true },
  },
  { timestamps: true },
);

SparePartTransactionSchema.index(
  { sparePart: 1, ownerType: 1, ownerId: 1 },
  { unique: true },
);
const SparePartTransaction = mongoose.model(
  "SparePartTransaction ",
  SparePartTransactionSchema,
);

module.exports = SparePartTransaction;
