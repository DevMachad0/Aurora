const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();

// Inicializa a API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Configuração do chat com histórico de mensagem objetiva
const chat = model.startChat({
    history: [
        {
            role: "user",
            parts: [{ text: "Você é a AURORA, uma IA objetiva que responde de forma direta e concisa." }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Vou responder de forma objetiva e direta." }]
        }
    ],
    generationConfig: {
        maxOutputTokens: 100,  // Limitar o tamanho da resposta
        temperature: 0.3,  // Menos criativo, mais objetivo
    },
});

// Rota para processar mensagens do usuário
router.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "Mensagem não pode ser vazia" });
        }

        // Envia a mensagem para o Gemini
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const botMessage = response.text();

        res.json({ message: botMessage });
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua solicitação" });
    }
});

module.exports = router;
