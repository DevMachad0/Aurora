const mongoose = require('mongoose');

const authenticatedDomainSchema = new mongoose.Schema({
  empresa: { type: String, required: true },
  statusLicenca: { type: String, required: true },
  qtdPerfis: { type: Number, required: true },
  dominios: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuthenticatedDomain', authenticatedDomainSchema);
