const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatHistory = require("../models/chatHistoryModel");
const { getChatHistory } = require("../services/chatService");
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
            parts: [{ text: "Você é a AURORA, uma assistente pessoal corporativa. Seu objetivo é fornecer apoio personalizado e eficiente, ajudando o usuário com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades. Suas respostas devem ser claras, objetivas e focadas em facilitar a execução de tarefas, sempre com um toque profissional e de precisão." }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Vou responder de forma objetiva e gentil, atendendo as nescessidades do meu usuario com textos planos." }]
        }
    ],
    generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.3,
    },
});

const planLimits = {
    MK1: 1000,
    MK2: 2000,
    MK3: 6000,
};

// Rota para processar mensagens do usuário
router.post("/chat", async (req, res) => {
    try {
        const { message, user } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Mensagem não pode ser vazia" });
        }

        // Obtém o histórico de conversas do usuário
        const chatHistory = await getChatHistory(user.email);

        // Cria um contexto para o modelo entender quem está falando
        const userContext = `Dados do usuario do sistema, Nome: ${user.nome}, E-mail: ${user.email}, Empresa: ${user.empresa}, Licença: ${user.licenca}, Plano: ${user.plano}, Dados: ${JSON.stringify(user.dados)}, Criado em: ${user.createdAt}, Atualizado em: ${user.updatedAt}.`;

        // Adiciona o histórico de conversas ao contexto
        const historyContext = chatHistory.map(chat => `${chat.timestamp} - ${chat.sender}: ${chat.message}`).join("\n");

        // Verifica o limite de caracteres baseado no plano do usuário
        const charLimit = planLimits[user.plano] || 1000;

        // Instrução para a IA respeitar o limite de caracteres
        const instruction = `Responda de forma direta e curta, sem ultrapassar ${charLimit} caracteres.`;

        // Envia a mensagem com contexto e instrução para a IA
        const result = await chat.sendMessage(`${userContext}\n\nHistórico de Conversas:\n${historyContext}\n\nInstrução: ${instruction}\n\nUsuário: ${message}`);
        const response = await result.response;
        let botMessage = response.text();

        // Salva o histórico de conversas no banco de dados
        let chatHistoryRecord = await ChatHistory.findOne({ email: user.email });
        if (!chatHistoryRecord) {
            chatHistoryRecord = new ChatHistory({
                user: user.nome,
                email: user.email,
                chat: [],
            });
        }

        chatHistoryRecord.chat.push({ sender: "user", message });
        chatHistoryRecord.chat.push({ sender: "bot", message: botMessage });
        chatHistoryRecord.updatedAt = Date.now();
        await chatHistoryRecord.save();

        res.json({ message: botMessage });
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua solicitação" });
    }
});

module.exports = router;
