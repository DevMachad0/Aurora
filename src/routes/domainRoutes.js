const express = require("express");
const router = express.Router();
const Domain = require("../models/domainModel");

// Rota para cadastrar um novo domínio
router.post("/add-domain", async (req, res) => {
  const { empresa, domain } = req.body;

  try {
    const newDomain = new Domain({ empresa, domain });
    await newDomain.save();
    res.status(201).json({ message: "Domínio cadastrado com sucesso!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
