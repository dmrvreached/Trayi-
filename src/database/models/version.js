const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    version_number: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Version", schema);
