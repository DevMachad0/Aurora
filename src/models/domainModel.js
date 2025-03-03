const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema({
  empresa: {
    type: String,
    required: true,
  },
  domains: {
    type: [String], // Modificado para ser um array de strings
    required: true,
  },
});

const Domain = mongoose.model("Domain", domainSchema);

module.exports = Domain;
