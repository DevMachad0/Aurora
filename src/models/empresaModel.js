const mongoose = require("mongoose");

const empresaSchema = new mongoose.Schema({
    
  tipo: {
    type: String,
    required: true,
    default: "documento"
  },
  empresa: {
    type: String,
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  conteudo: {
    type: [String],
    required: true
  }
});

const Empresa = mongoose.model("Empresa", empresaSchema);

module.exports = Empresa;
