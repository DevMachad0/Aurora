const mongoose = require("mongoose");

const auroraCoreSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["instructions", "restrictions"],
  },
  content: {
    type: [String],
    required: true,
  },
});

const AuroraCore = mongoose.model("AuroraCore", auroraCoreSchema);

module.exports = AuroraCore;
