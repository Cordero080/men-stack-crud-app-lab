// models/Form.js
const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    rankType:   { type: String, enum: ["kyu", "dan"], required: true },
    rankNumber: { type: Number, required: true, min: 1 },   // ← Number
    beltColor:  { type: String, trim: true },
    category:   {
      type: String,
      enum: ["Kata", "Bunkai", "Kumite", "Weapon", "Other"],
      default: "Kata",
      trim: true,
    },
    description:  { type: String, default: "" },            // ← default
    referenceUrl: { type: String, trim: true },
    learned:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique combo to avoid duplicates like same name+rank repeated
formSchema.index({ name: 1, rankType: 1, rankNumber: 1 }, { unique: true });

module.exports = mongoose.model("Form", formSchema);
