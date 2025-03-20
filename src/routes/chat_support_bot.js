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
            parts: [{ text: "Você é a AURORA(Modulo suporte ao cliente), uma assistente pessoal corporativa(Modulo suporte ao cliente). Seu objetivo é fornecer apoio personalizado e eficiente, ajudando o usuário com questões diárias, utilizando os dados disponíveis sobre suas preferências e necessidades. Suas respostas devem ser claras, objetivas e focadas em facilitar a execução de tarefas, sempre com um toque profissional e de precisão. Não gere textos em HTML ou Markdown. Responda de forma direta, sem ultrapassar 6000 caracteres." }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Vou responder de forma objetiva e gentil, atendendo as nescessidades do meu usuario com textos planos, sem usar HTML ou Markdown e respeitando o limite de 6000 caracteres. também não fornecerei informações dos dados dos perfis para os clientes; utilizarei essas informações apenas para lidar com os clientes." }]
        }
    ],
    generationConfig: {
        temperature: 0.3,
    },
});

const chatHistory = {}; // Armazena o histórico de mensagens por número de protocolo

async function getResponse({ userMessage, context, protocolNumber }) {
    try {
        if (userMessage.length > 10000) {
            return "Erro: A mensagem ultrapassou o limite de 10000 caracteres.";
        }

        // Inicializa o histórico se não existir
        if (!chatHistory[protocolNumber]) {
            chatHistory[protocolNumber] = [
                {
                    role: "user",
                    parts: [{ text: context }],
                },
            ];
        }

        // Adiciona a mensagem do usuário ao histórico
        chatHistory[protocolNumber].push({
            role: "user",
            parts: [{ text: userMessage }],
        });

        const result = await chat.sendMessage({
            history: chatHistory[protocolNumber],
        });

        const response = await result.response;
        let responseText = response.text();

        // Adiciona a resposta da Aurora ao histórico
        chatHistory[protocolNumber].push({
            role: "model",
            parts: [{ text: responseText }],
        });

        if (responseText.length > 6000) {
            responseText = responseText.substring(0, 6000) + "...";
        }

        return responseText;
    } catch (error) {
        console.error("Erro ao conectar com Gemini:", error);
        return "Erro ao processar sua solicitação";
    }
}

module.exports = { getResponse };
