const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

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

async function getResponse(message) {
    try {
        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        return "Erro ao processar sua solicitação";
    }
}

module.exports = { getResponse };
