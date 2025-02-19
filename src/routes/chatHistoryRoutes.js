const express = require("express");
const { getChatHistory } = require("../services/chatService");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/chat-history", verifyToken, async (req, res) => {
    try {
        const { date, text } = req.query;
        const email = req.headers["user-email"];
        const empresa = req.headers["user-empresa"];

        if (!email || !empresa) {
            return res.status(400).json({ error: "E-mail ou empresa do usuário não encontrado" });
        }

        let chatHistory = await getChatHistory(email, empresa);

        if (date) {
            chatHistory = chatHistory.filter(chat => new Date(chat.timestamp).toISOString().split("T")[0] === date);
        }

        if (text) {
            chatHistory = chatHistory.filter(chat => chat.message.includes(text));
        }

        res.json(chatHistory);
    } catch (error) {
        console.error("Erro ao buscar histórico de conversas:", error);
        res.status(500).json({ error: "Erro ao buscar histórico de conversas" });
    }
});

module.exports = router;
