const express = require('express');
const router = express.Router();

// Rota para receber mensagens do chat
router.post('/chat-support', (req, res) => {
    const userMessage = req.body.message;

    console.log("📩 Mensagem recebida do usuário:", userMessage);

    // Aqui você pode processar a mensagem e integrar com IA (ex: Gemini, OpenAI, Deepseek)
    const botReply = `Recebi sua mensagem: "${userMessage}"`;

    res.json({ reply: botReply });
});

module.exports = router;
