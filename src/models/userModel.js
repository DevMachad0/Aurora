const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  empresa: {
    type: String,
    required: true,
  },
  usuario: {
    type: String,
    required: true,
  },
  senha: {
    type: String,
    required: true,
  },
  licenca: {
    type: String,
    required: true,
  },
  plano: {
    type: String,
    required: true,
  },
  dados: {
    type: [String],
    required: true,
  },
}, { timestamps: true });

// Função para criptografar a senha antes de salvar o usuário
userSchema.pre("save", async function(next) {
  if (!this.isModified("senha")) return next();
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
