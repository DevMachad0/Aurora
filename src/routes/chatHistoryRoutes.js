const express = require("express");
const { getChatHistory, saveChatHistory } = require("../services/chatService");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/chat-history", verifyToken, async (req, res) => {
    try {
        const { date, text } = req.query;
        const email = req.headers["user-email"];
        const empresa = req.headers["user-empresa"];

        if (!email || !empresa) {
            return res.status(400).json({ error: "Email ou empresa do usuário não encontrado" });
        }

        console.log(`Parâmetros recebidos - Email: ${email}, Empresa: ${empresa}, Date: ${date}, Text: ${text}`); // Log para depuração

        let chatHistory = await getChatHistory(email, empresa, date);

        if (text) {
            chatHistory = chatHistory.filter(chat => chat.message.includes(text));
        }

        res.json(chatHistory);
    } catch (error) {
        console.error("Erro ao buscar histórico de conversas:", error);
        res.status(500).json({ error: "Erro ao buscar histórico de conversas" });
    }
});

router.post("/chat-history", verifyToken, async (req, res) => {
    try {
        const { email, empresa, chatData } = req.body;
        console.log(`Parâmetros recebidos - Email: ${email}, Empresa: ${empresa}, ChatData: ${JSON.stringify(chatData)}`); // Log para depuração

        await saveChatHistory(email, empresa, chatData);

        res.status(200).json({ message: "Histórico de chat salvo com sucesso" });
    } catch (error) {
        console.error("Erro ao salvar histórico de conversas:", error);
        res.status(500).json({ error: "Erro ao salvar histórico de conversas" });
    }
});

module.exports = router;
