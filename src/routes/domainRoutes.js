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

// Rota para obter informações do domínio e a empresa a que ele pertence
router.get("/get-domain-info", async (req, res) => {
  const { domain } = req.query;

  try {
    const domainData = await Domain.findOne({ domains: domain });

    if (domainData) {
      res.status(200).json({ empresa: domainData.empresa, domains: domainData.domains });
    } else {
      res.status(404).json({ message: "Domínio não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
