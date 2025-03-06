const express = require("express");
const router = express.Router();
const Empresa = require("../models/empresaModel");

// Rota para cadastrar dados da empresa
router.post("/add-empresa", async (req, res) => {
  const { tipo, empresa, nome, conteudo } = req.body;

  try {
    const newEmpresa = new Empresa({ tipo, empresa, nome, conteudo });
    await newEmpresa.save();
    res.status(201).json({ message: "Dados da empresa cadastrados com sucesso!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para consultar dados da empresa com base no tipo e empresa
router.get("/empresa/:tipo/:empresa", async (req, res) => {
  const { tipo, empresa } = req.params;

  try {
    const empresaData = await Empresa.findOne({ tipo, empresa });

    if (!empresaData) {
      return res.status(404).json({ message: "Dados da empresa não encontrados." });
    }

    res.json(empresaData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
