const express = require("express");
const { getChatHistory } = require("../services/chatService");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/agendamentos", async (req, res) => {
    try {
        const email = req.headers["user-email"];
        const empresa = req.headers["user-empresa"];
        const database = req.headers["user-database"];

        if (!email || !empresa || !database) {
            return res.status(400).json({ error: "Email, empresa ou database do usuário não encontrado" });
        }

        const chatHistory = await getChatHistory(email, empresa);

        const agendamentos = chatHistory.filter(chat => chat.message.includes("tipo: agendamento"))
            .map(chat => {
                const lines = chat.message.split('\n');
                return {
                    titulo: lines[1].split(': ')[1],
                    data: lines[2].split(': ')[1],
                    hora: lines[3].split(': ')[1],
                    descricao: lines[4].split(': ')[1],
                    prioridade: lines[5].split(': ')[1],
                    tipo: lines[6].split(': ')[1]
                };
            });

        res.json({ agendamentos });
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
});

module.exports = router;
