const express = require("express");
const router = express.Router();
const { createUser, getUserByEmail, getUserById } = require("../services/userService");
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



module.exports = router;