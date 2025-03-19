const express = require("express");
const { getUserEvents } = require("../services/chatService");

const router = express.Router();

// Rota para obter agendamentos do usuário
router.get("/user-events", async (req, res) => {
    try {
        const email = req.query.email;
        const database = req.query.database;

        if (!email || !database) {
            return res.status(400).json({ error: "E-mail e banco de dados são obrigatórios." });
        }

        const events = await getUserEvents(email, database);
        res.status(200).json(events);
    } catch (error) {
        console.error("Erro ao obter eventos do usuário:", error);
        res.status(500).json({ error: "Erro ao obter eventos do usuário." });
    }
});

module.exports = router;
