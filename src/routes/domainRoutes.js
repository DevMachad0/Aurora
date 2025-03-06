const express = require("express");
const router = express.Router();
const Domain = require("../models/domainModel");

// Rota para cadastrar um novo domínio
router.post("/add-domain", async (req, res) => {
  const { empresa, domains } = req.body;

  try {
    const newDomain = new Domain({ empresa, domains });
    await newDomain.save();
    res.status(201).json({ message: "Domínio cadastrado com sucesso!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para buscar a empresa pelo domínio
router.get("/empresa/:domain", async (req, res) => {
    try {
        const { domain } = req.params;
        const domainData = await Domain.findOne({ domains: domain });

        if (!domainData) {
            return res.status(404).json({ message: "Empresa não encontrada para este domínio." });
        }

        return res.json({ empresa: domainData.empresa });
    } catch (error) {
        console.error("Erro ao buscar empresa pelo domínio:", error.message);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;