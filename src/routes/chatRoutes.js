const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getChatHistory, saveChatHistory, getEmpresaData, getUserEvents, getTodayEvents } = require("../services/chatService");
const { getAuroraCoreData } = require("../services/auroraCoreService");
const AuroraCore = require("../models/auroraCoreModel");
require("dotenv").config();

const router = express.Router();

// Inicializa a API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// Configuração do chat com histórico de mensagem objetiva
const chat = model.startChat({
    history: [
        {
            role: "user",
            parts: [{ text: "Você é a AURORA(modulo chat), uma assistente pessoal corporativa. Seu objetivo é fornecer apoio personalizado e eficiente, ajudando o usuário com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades. Suas respostas devem ser claras, objetivas e focadas em facilitar a execução de tarefas, sempre com um toque profissional e de precisão." }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Vou responder de forma objetiva e gentil, atendendo as necessidades do meu usuário com textos planos." }]
        }
    ],
    generationConfig: {
        temperature: 0.7,
    },
});

const planLimits = {
    MK1: 1000,
    MK2: 4000,
    MK3: 10000,
};

// Função para repetir a solicitação com atraso
async function retryWithDelay(fn, retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1 || error.status !== 503) throw error;
            console.log(`Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Função para obter a data e hora atuais
function getCurrentDateTime() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Rota para processar mensagens do usuário
router.post("/chat", async (req, res) => {
    try {
        const { message, user } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Mensagem não pode ser vazia" });
        }

        // Atualiza a data e hora atuais apenas para essa interação
        let currentDateTime = getCurrentDateTime();

        // Obtém o histórico de conversas do usuário
        const chatHistory = await getChatHistory(user.email, user.empresa);

        // Obtém os agendamentos do usuário
        const userEvents = await getUserEvents(user.email, user.empresa);
        const todayEvents = await getTodayEvents(user.email, user.empresa);

        const eventsContext = userEvents.length
            ? userEvents.map(event => `Evento: ${event.title}, Data: ${event.date}, Horário: ${event.startTime} - ${event.endTime}, Descrição: ${event.description}`).join("\n")
            : "Nenhum evento encontrado.";

        const todayEventsContext = todayEvents.length
            ? todayEvents.map(event => `Evento: ${event.title}, Horário: ${event.startTime} - ${event.endTime}, Descrição: ${event.description}`).join("\n")
            : "Nenhum evento para hoje.";

        // Cria um contexto para o modelo entender quem está falando
        const userContext = `Dados do usuário do sistema: Nome: ${user.nome}, E-mail: ${user.email}, Empresa: ${user.empresa}, Licença: ${user.licenca}, Plano: ${user.plano}, Dados: ${JSON.stringify(user.dados)}, Criado em: ${user.createdAt}, Atualizado em: ${user.updatedAt}.`;

        // Adiciona o histórico de conversas e eventos ao contexto
        const historyContext = `${chatHistory ? chatHistory.map(chat => `${chat.timestamp} - ${chat.sender}: ${chat.message}`).join("\n") : ""}\n\nAgendamentos do Usuário:\n${eventsContext}\n\nAgendamentos de Hoje:\n${todayEventsContext}`;

        // Obtém as instruções e restrições do AuroraCore
        const auroraCoreData = await getAuroraCoreData();

        // Obtém os dados da empresa com base no tipo "documento"
        const empresaData = await getEmpresaData(user.empresa, "documento");

        // Verifica o limite de caracteres baseado no plano do usuário
        const charLimit = planLimits[user.plano] || 1000;

        // Instrução para a IA respeitar o limite de caracteres e destacar títulos
        const instruction = `Responda de forma direta e curta, sem ultrapassar ${charLimit} caracteres. Sempre que for gerar um título, destaque o começo e o final do título com "#" a depender do tamanho que você escolher para o <h>.`;

        // Adiciona as instruções e restrições do AuroraCore ao contexto
        const coreInstructions = auroraCoreData.instructions.join("\n");
        const coreRestrictions = auroraCoreData.restrictions.join("\n");

        // Adiciona os dados da empresa ao contexto
        const empresaContext = empresaData ? `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}` : "Dados da empresa não encontrados.";

        // Envia a mensagem com contexto e instrução para a IA
        const result = await retryWithDelay(() => chat.sendMessage(`${userContext}\n\nData e Hora Atuais: ${currentDateTime}\n\nHistórico de Conversas:\n${historyContext}\n\nInstrução: ${instruction}\n\nInstruções do AuroraCore:\n${coreInstructions}\n\nRestrições do AuroraCore:\n${coreRestrictions}\n\n${empresaContext}\n\nUsuário: ${message}`));
        const response = await result.response;
        let botMessage = response.text();

        // Salva o histórico de conversas no banco de dados
        await saveChatHistory(user.email, user.empresa, { sender: "user", message });
        await saveChatHistory(user.email, user.empresa, { sender: "Aurora", message: botMessage });

        res.json({ message: botMessage });
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua solicitação" });
    }
});

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
