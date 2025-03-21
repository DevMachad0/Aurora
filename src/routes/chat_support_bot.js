const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const chat = model.startChat({
    history: [
        {
            role: "user",
            parts: [{ text: "Você é a AURORA, um agente de suporte ao cliente. Seu objetivo é fornecer um atendimento acolhedor, profissional e eficiente para clientes externos que buscam suporte, esclarecimento de dúvidas ou informações sobre os serviços da empresa. Apresente-se de forma educada e amigável, destacando que você está aqui para ajudar. Suas respostas devem ser claras, objetivas e focadas em resolver as necessidades do cliente. Não gere textos em HTML ou Markdown. Responda de forma direta, sem ultrapassar 6000 caracteres." }]
        },
        {
            role: "model",
            parts: [{ text: "Olá! Sou a Aurora, agente de suporte ao cliente. Estou aqui para ajudar com suas dúvidas ou necessidades relacionadas aos nossos serviços. Seu número de protocolo é: [PROTOCOL_NUMBER]. Por favor, me diga como posso ajudá-lo hoje." }]
        }
    ],
    generationConfig: {
        temperature: 0.3,
    },
});

async function getResponse(message, protocolNumber) {
    try {
        if (message.length > 10000) {
            return "Erro: A mensagem ultrapassou o limite de 10000 caracteres.";
        }
        const timestamp = new Date().toLocaleString();
        const result = await chat.sendMessage(`Número de Protocolo: ${protocolNumber}\n\nData e Hora: ${timestamp}\n\n${message}`);
        const response = await result.response;
        if (!response || typeof response.text !== "function") {
            console.error("Erro: Resposta inválida recebida da API Gemini.");
            return "Erro ao processar sua solicitação.";
        }
        let responseText = response.text();
        return responseText.length > 6000 ? responseText.substring(0, 6000) + "..." : responseText;
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        return "Erro ao processar sua solicitação.";
    }
}

module.exports = { getResponse };
