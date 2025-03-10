const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getChatHistory, saveChatHistory, getEmpresaData } = require("../services/chatService");
const { getAuroraCoreData } = require("../services/auroraCoreService");
const { createGoogleEvent, getGoogleEvents, updateGoogleEvent, isAuthenticated } = require("../services/googleCalendarService");
const AuroraCore = require("../models/auroraCoreModel");
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
        temperature: 0.7,
    },
});

const planLimits = {
    MK1: 1000,
    MK2: 2000,
    MK3: 6000,
};

// Função para repetir a solicitação com atraso
async function retryWithDelay(fn, retries = 3, delay = 2000) {
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
    const now = new Date();
    return now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Rota para processar mensagens do usuário
router.post("/chat", async (req, res) => {
    try {
        const { message, user } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Mensagem não pode ser vazia" });
        }

        // Verifica se o usuário está autenticado
        if (!isAuthenticated(user.email)) {
            return res.status(401).json({ error: "Usuário não autenticado. Por favor, faça login." });
        }

        // Verifica se a mensagem é uma solicitação de agendamento
        if (message.toLowerCase().includes("agendar evento")) {
            const eventDetails = await getEventDetailsFromUser(message);
            const eventResponse = await createGoogleEvent(user.email, eventDetails);
            return res.json({ message: eventResponse });
        }

        // Verifica se a mensagem é uma solicitação para ver eventos
        if (message.toLowerCase().includes("ver eventos")) {
            const events = await getGoogleEvents(user.email);
            return res.json({ message: `Eventos: ${events.join(", ")}` });
        }

        // Verifica se a mensagem é uma solicitação para modificar um evento
        if (message.toLowerCase().includes("modificar evento")) {
            const eventDetails = await getEventDetailsFromUser(message);
            const eventResponse = await updateGoogleEvent(user.email, eventDetails);
            return res.json({ message: eventResponse });
        }

        // Obtém a data e hora atuais
        const currentDateTime = getCurrentDateTime();

        // Obtém o histórico de conversas do usuário
        const chatHistory = await getChatHistory(user.email, user.empresa);

        // Obtém as instruções e restrições do AuroraCore
        const auroraCoreData = await getAuroraCoreData();

        // Obtém os dados da empresa com base no tipo "documento"
        const empresaData = await getEmpresaData(user.empresa, "documento");

        // Cria um contexto para o modelo entender quem está falando
        const userContext = `Dados do usuario do sistema, Nome: ${user.nome}, E-mail: ${user.email}, Empresa: ${user.empresa}, Licença: ${user.licenca}, Plano: ${user.plano}, Dados: ${JSON.stringify(user.dados)}, Criado em: ${user.createdAt}, Atualizado em: ${user.updatedAt}.`;

        // Adiciona o histórico de conversas ao contexto
        const historyContext = chatHistory.map(chat => `${chat.timestamp} - ${chat.sender}: ${chat.message}`).join("\n");

        // Verifica o limite de caracteres baseado no plano do usuário
        const charLimit = planLimits[user.plano] || 1000;

        // Instrução para a IA respeitar o limite de caracteres e destacar títulos
        const instruction = `Responda de forma direta e curta, sem ultrapassar ${charLimit} caracteres. Sempre que for gerar um título, destaque o começo e o final do título com "#" a depender do tamanho que você escolher para o <h>.`;

        // Adiciona as instruções e restrições do AuroraCore ao contexto
        const coreInstructions = auroraCoreData.instructions.join("\n");
        const coreRestrictions = auroraCoreData.restrictions.join("\n");

        // Adiciona os dados da empresa ao contexto
        const empresaContext = `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}`;

        // Envia a mensagem com contexto e instrução para a IA
        const result = await retryWithDelay(() => chat.sendMessage(`${userContext}\n\nData e Hora Atuais: ${currentDateTime}\n\nHistórico de Conversas:\n${historyContext}\n\nInstrução: ${instruction}\n\nInstruções do AuroraCore:\n${coreInstructions}\n\nRestrições do AuroraCore:\n${coreRestrictions}\n\n${empresaContext}\n\nInformações em tempo real são: ${currentDateTime}\n\nUsuário: ${message}`));
        const response = await result.response;
        let botMessage = response.text();

        // Salva o histórico de conversas no banco de dados
        await saveChatHistory(user.email, user.empresa, { sender: "user", message });
        await saveChatHistory(user.email, user.empresa, { sender: "bot", message: botMessage });

        res.json({ message: botMessage });
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua solicitação" });
    }
});

async function getEventDetailsFromUser(message) {
    const regex = /titulo:\s*(.*?)\s*data:\s*(.*?)\s*apenas isso/i;
    const match = message.match(regex);

    if (!match) {
        throw new Error("Detalhes do evento não encontrados na mensagem.");
    }

    const [_, title, dateTime] = match;
    const [date, time] = dateTime.split(" ");

    return {
        summary: title,
        description: "Evento criado pela Aurora",
        start: {
            dateTime: new Date(`${date}T${time}:00`).toISOString(),
            timeZone: "America/Sao_Paulo",
        },
        end: {
            dateTime: new Date(`${date}T${time}:00`).toISOString(),
            timeZone: "America/Sao_Paulo",
        },
    };
}

module.exports = router;
