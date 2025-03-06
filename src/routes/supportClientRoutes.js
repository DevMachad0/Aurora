const express = require("express");
const router = express.Router();
const SupportClient = require("../models/supportClientModel");

// Rota para cadastrar um novo cliente de suporte
router.post("/add-support-client", async (req, res) => {
  const { firstName, lastName, cpf, email, domain, protocolNumber, status, observacao, messages } = req.body;

  try {
    const newSupportClient = new SupportClient({
      firstName,
      lastName,
      cpf,
      email,
      domain,
      protocolNumber,
      status,
      observacao,
      messages,
    });

    await newSupportClient.save();
    res.status(201).json({ message: "Cliente de suporte cadastrado com sucesso!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
