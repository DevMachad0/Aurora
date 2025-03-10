const express = require("express");
const { login } = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");
const passport = require("passport");

const router = express.Router();

// Rota para login
router.post("/login", login);

// Rota para autenticação com o Google
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email", "https://www.googleapis.com/auth/calendar.events"] }));

// Rota de callback do Google
router.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/" }), 
  (req, res) => {
    console.log("Autenticação com o Google bem-sucedida!"); // Adiciona um console.log de confirmação
    res.redirect("/chat-aurora.html"); // Redireciona para a página correta após a autenticação
  }
);

// Rota protegida para acessar a página do Chat-Aurora
router.get("/chat-aurora", verifyToken, (req, res) => {
    res.send("Bem-vindo ao Chat-Aurora!");
});

module.exports = router;
