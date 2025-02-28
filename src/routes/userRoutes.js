const express = require("express");
const router = express.Router();
const { createUser, getUserByEmail, getUserById, updateUserDados, updateUserTokenAdmin } = require("../services/userService");
const verifyToken = require("../middleware/verifyToken");

// Rota para criar usuário
router.post("/", async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para buscar usuário por e-mail
router.get("/:email", async (req, res) => {
  try {
    const user = await getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para atualizar dados do usuário
router.post("/update-dados", verifyToken, async (req, res) => {
  const { email, dados } = req.body;

  try {
    await updateUserDados(email, dados);
    res.status(200).json({ message: "Dados atualizados com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar dados do usuário." });
  }
});

// Rota para atualizar tokenAdmin do usuário
router.post("/update-token-admin", verifyToken, async (req, res) => {
  const { email, tokenAdmin } = req.body;

  try {
    await updateUserTokenAdmin(email, tokenAdmin);
    res.status(200).json({ message: "Token atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar token do usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar token do usuário." });
  }
});

module.exports = router;