const express = require("express");
const { login } = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Rota para login
router.post("/login", login);


// Rota protegida para acessar a página do Chat-Aurora
router.get("/chat-aurora", verifyToken, (req, res) => {
  res.send("Bem-vindo ao Chat-Aurora!");
  
});

module.exports = router;
