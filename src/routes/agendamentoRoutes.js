const express = require("express");
const { getChatHistory, updateChatMessage } = require("../services/chatService");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/agendamentos", async (req, res) => {
    try {
        const email = req.headers["user-email"];
        const empresa = req.headers["user-empresa"]?.trim();
        const database = req.headers["user-database"]?.trim();

        if (!email || !empresa || !database) {
            return res.status(400).json({ error: "Email, empresa ou database do usuário não encontrado" });
        }

        const chatHistory = await getChatHistory(email, empresa);

        // Filtra mensagens enviadas por "Aurora" que contêm "Recebido! Aqui estão os detalhes do seu agendamento:"
        const agendamentos = chatHistory
            .filter(chat => chat.sender === "Aurora" && chat.message.includes("Recebido! Aqui estão os detalhes do seu agendamento:"))
            .map(chat => {
                const lines = chat.message.split('\n');
                try {
                    return {
                        titulo: lines[1]?.split(': ')[1] || "Sem título",
                        data: lines[2]?.split(': ')[1] || "Data não encontrada",
                        hora: lines[3]?.split(': ')[1] || "Hora não encontrada",
                        descricao: lines[4]?.split(': ')[1] || "Sem descrição",
                        prioridade: lines[5]?.split(': ')[1] || "Normal",
                        tipo: lines[6]?.split(': ')[1] || "Outro"
                    };
                } catch (error) {
                    console.error("Erro ao processar um agendamento:", error);
                    return null;
                }
            })
            .filter(a => a !== null); // Remove agendamentos inválidos

        console.log("Agendamentos encontrados:", agendamentos); // Log para depuração

        res.json({ agendamentos });
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
});

router.post("/agendamentos/delete", async (req, res) => {
    try {
        const email = req.headers["user-email"];
        const empresa = req.headers["user-empresa"];
        const database = req.headers["user-database"];
        const { titulo, data, hora, descricao, prioridade } = req.body;

        if (!email || !empresa || !database) {
            return res.status(400).json({ error: "Email, empresa ou database do usuário não encontrado" });
        }

        const chatHistory = await getChatHistory(email, empresa);

        const agendamento = chatHistory.find(chat => 
            chat.sender === "Aurora" && 
            chat.message.includes("Recebido! Aqui estão os detalhes do seu agendamento:") &&
            chat.message.includes(`Título: ${titulo}`) &&
            chat.message.includes(`Data: ${data}`) &&
            chat.message.includes(`Hora: ${hora}`) &&
            chat.message.includes(`Descrição: ${descricao}`) &&
            chat.message.includes(`Prioridade: ${prioridade}`)
        );

        if (agendamento) {
            const updatedMessage = `(excluido) ${agendamento.message}`;
            await updateChatMessage(agendamento._id, updatedMessage);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Agendamento não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao excluir agendamento:", error);
        res.status(500).json({ error: "Erro ao excluir agendamento" });
    }
});

module.exports = router;
