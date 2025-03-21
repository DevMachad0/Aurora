const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const chat = model.startChat({
    history: [
        {
            role: "user",
            parts: [{ text: "Você é a AURORA(Modulo suporte ao cliente), uma assistente pessoal corporativa. Seu objetivo é fornecer apoio personalizado e eficiente, ajudando o usuário com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades. Suas respostas devem ser claras, objetivas e focadas em facilitar a execução de tarefas, sempre com um toque profissional e de precisão. Não gere textos em HTML ou Markdown. Responda de forma direta, sem ultrapassar 6000 caracteres." }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Vou responder de forma objetiva e gentil, atendendo as necessidades do meu usuário com textos planos, sem usar HTML ou Markdown e respeitando o limite de 6000 caracteres." }]
        }
    ],
    generationConfig: {
        temperature: 0.3,
    },
});

async function getResponse(message) {
    try {
        if (message.length > 10000) {
            return "Erro: A mensagem ultrapassou o limite de 10000 caracteres.";
        }
        const timestamp = new Date().toLocaleString();
        const result = await chat.sendMessage(`Data e Hora: ${timestamp}\n\n${message}`);
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
