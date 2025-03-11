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

// Variáveis globais para armazenar os detalhes do evento
let eventDetails = {
    summary: "",
    start: {
        dateTime: ""
    },
    end: {
        dateTime: ""
    },
    location: "",
    attendees: [],
    description: ""
};

// Função para formatar a data no formato brasileiro
function formatDateToBR(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

// Função para resetar os detalhes do evento
function resetEventDetails() {
    eventDetails = {
        summary: "",
        start: {
            dateTime: ""
        },
        end: {
            dateTime: ""
        },
        location: "",
        attendees: [],
        description: ""
    };
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
        if (message.toLowerCase().includes("criar evento")) {
            resetEventDetails();
            return res.json({ message: "Vamos criar um novo evento. Qual é o título do evento?" });
        }

        // Coleta os detalhes do evento passo a passo
        if (!eventDetails.summary) {
            eventDetails.summary = message;
            return res.json({ message: "Qual é a data de início do evento? (Formato: DD/MM/AAAA)" });
        }

        if (!eventDetails.start.dateTime) {
            const [day, month, year] = message.split("/");
            eventDetails.start.dateTime = `${year}-${month}-${day}`;
            return res.json({ message: "Qual é a hora de início do evento? (Formato: HH:MM)" });
        }

        if (!eventDetails.end.dateTime) {
            eventDetails.end.dateTime = `${eventDetails.start.dateTime}T${message}:00`;
            return res.json({ message: "Qual é a data de término do evento? (Formato: DD/MM/AAAA)" });
        }

        if (!eventDetails.end.dateTime.includes("T")) {
            const [day, month, year] = message.split("/");
            eventDetails.end.dateTime = `${year}-${month}-${day}T${eventDetails.end.dateTime.split("T")[1]}`;
            return res.json({ message: "Qual é a localização do evento?" });
        }

        if (!eventDetails.location) {
            eventDetails.location = message;
            return res.json({ message: "Quais são os e-mails dos participantes? (Separe por vírgula)" });
        }

        if (eventDetails.attendees.length === 0) {
            eventDetails.attendees = message.split(",").map(email => ({ email: email.trim() }));
            return res.json({ message: "Deseja adicionar uma descrição ao evento? (Se não, responda 'não')" });
        }

        if (!eventDetails.description && message.toLowerCase() !== "não") {
            eventDetails.description = message;
        }

        // Confirmação final
        return res.json({ message: `Confirme os detalhes do evento:\nTítulo: ${eventDetails.summary}\nInício: ${formatDateToBR(eventDetails.start.dateTime.split("T")[0])} ${eventDetails.start.dateTime.split("T")[1]}\nTérmino: ${formatDateToBR(eventDetails.end.dateTime.split("T")[0])} ${eventDetails.end.dateTime.split("T")[1]}\nLocalização: ${eventDetails.location}\nParticipantes: ${eventDetails.attendees.map(a => a.email).join(", ")}\nDescrição: ${eventDetails.description || "Nenhuma"}\n\nResponda 'sim' para confirmar e criar o evento.` });

    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua solicitação" });
    }
});

// Rota para confirmar e criar o evento
router.post("/confirm-event", async (req, res) => {
    try {
        const { message, user } = req.body;
        if (message.toLowerCase() === "sim") {
            const eventResponse = await createGoogleEvent(user.email, eventDetails);
            resetEventDetails();
            return res.json({ message: eventResponse });
        } else {
            resetEventDetails();
            return res.json({ message: "Criação de evento cancelada." });
        }
    } catch (error) {
        console.error("Erro ao criar evento no Google Calendar:", error);
        res.status(500).json({ error: "Erro ao criar evento no Google Calendar" });
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