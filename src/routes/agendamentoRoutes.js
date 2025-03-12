const express = require("express");
const { getChatHistory } = require("../services/chatService");
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

router.post("/agendamentos/excluir", async (req, res) => {
    try {
        const { titulo, data, hora } = req.body;
        const email = req.headers["user-email"];
        const empresa = req.headers["user-empresa"]?.trim();
        const database = req.headers["user-database"];
        if (!email || !empresa || !database) {
            return res.status(400).json({ error: "Email, empresa ou database do usuário não encontrado" });
        }

        const db = mongoose.connection.useDb(database);
        
        
        console.log(`Nome da coleção formatado corretamente: ${database}`); // Log para depuração

        const collection = db.collection(database);

        const result = await collection.updateOne(
            { email, "chat.message": { $regex: `Recebido! Aqui estão os detalhes do seu agendamento:\n- Título: ${titulo}\n- Data: ${data}\n- Hora: ${hora}` } },
            { $set: { "chat.$.message": `(Excluído) Recebido! Aqui estão os detalhes do seu agendamento:\n- Título: ${titulo}\n- Data: ${data}\n- Hora: ${hora}` } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Agendamento não encontrado" });
        }

        res.status(200).json({ message: "Agendamento marcado como excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao marcar agendamento como excluído:", error);
        res.status(500).json({ error: "Erro ao marcar agendamento como excluído" });
    }
});

module.exports = router;
