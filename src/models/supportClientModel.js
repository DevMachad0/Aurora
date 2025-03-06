const mongoose = require("mongoose");

const supportClientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  domain: {
    type: String,
    required: true,
  },
  protocolNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["Em atendimento(Aurora)", "Aguardando atendimento(humano)", "Em atendimento", "Finalizado"],
    default: "Em atendimento(Aurora)",
  },
  observacao: {
    type: String,
    default: "",
  },
  messages: [
    {
      sender: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

const SupportClient = mongoose.model("SupportClient", supportClientSchema);

module.exports = SupportClient;
