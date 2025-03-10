// chatRoutes.js
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
            parts: [{ text: "Você é a AURORA, uma assistente pessoal corporativa. Seu objetivo é fornecer apoio personalizado e eficiente, ajudando o usuário com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades. Suas respostas devem ser claras, objetivas e focadas em facilitar a execução de tarefas, sempre com um toque profissional e de precisão. Você tem a capacidade de criar, visualizar e modificar eventos no Google Agenda do usuário." }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Vou responder de forma objetiva e gentil, atendendo as nescessidades do meu usuario com textos planos. Eu posso criar eventos no Google Agenda para você." }]
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

        // Verifica se a IA detectou uma solicitação de agendamento
        if (botMessage.toLowerCase().includes("agendar evento")) {
            // Solicita os detalhes do evento ao usuário
            const eventDetails = await solicitEventDetails(user.email, message);
            if (eventDetails) {
                // Valida os detalhes do evento antes de criar o evento
                if (validateEventDetails(eventDetails)) {
                    const eventResponse = await createGoogleEvent(user.email, eventDetails);
                    botMessage = eventResponse;
                } else {
                    botMessage = "Detalhes do evento inválidos. Por favor, forneça informações corretas.";
                }
            } else {
                botMessage = "Agendamento de evento cancelado.";
            }
        }

        // Salva o histórico de conversas no banco de dados
        await saveChatHistory(user.email, user.empresa, { sender: "user", message });
        await saveChatHistory(user.email, user.empresa, { sender: "bot", message: botMessage });

        res.json({ message: botMessage });
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua solicitação" });
    }
});

async function solicitEventDetails(email, message) {
    // Solicita os detalhes do evento ao usuário usando a IA
    const result = await chat.sendMessage(`Com base na mensagem do usuário: "${message}", solicite as informações necessárias para agendar um evento no Google Agenda. Pergunte sobre o título, data e hora de início, data e hora de término, localização (presencial ou online), participantes (emails) e descrição (opcional). Se o usuário fornecer todas as informações, retorne um objeto JSON no seguinte formato: { summary: "título", start: { dateTime: "data e hora de início" }, end: { dateTime: "data e hora de término" }, location: "localização", attendees: [{ email: "email1" }, { email: "email2" }], description: "descrição" }. Se o usuário cancelar, retorne null.`);
    const response = await result.response;
    const botMessage = response.text();

    try {
        // Tenta analisar a resposta da IA como JSON
        const eventDetails = JSON.parse(botMessage);

        // Verifica se os campos obrigatórios estão presentes
        if (!eventDetails.summary || !eventDetails.start || !eventDetails.end) {
            throw new Error("Detalhes do evento incompletos.");
        }

        return eventDetails;
    } catch (error) {
        // Se a resposta não for JSON ou estiver incompleta, solicita as informações novamente
        return solicitEventDetails(email, `${message} ${botMessage}`);
    }
}

function validateEventDetails(eventDetails) {
    if (!eventDetails.summary || !eventDetails.start || !eventDetails.end) {
        return false;
    }

    // Valida os formatos de data e hora
    if (!isValidDate(eventDetails.start.dateTime) || !isValidDate(eventDetails.end.dateTime)) {
        return false;
    }

    return true;
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

module.exports = router;