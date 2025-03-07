const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio
const SupportClient = require('../models/supportClientModel'); // Importar o modelo de suporte ao cliente
const User = require('../models/userModel'); // Importar o modelo de usuário
const { getEmpresaData } = require('../services/chatService'); // Importar a função para obter dados da empresa
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
require("dotenv").config();

// Inicializa a API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const planLimits = {
    MK1: 1000,
    MK2: 2000,
    MK3: 6000,
};

// Variável para armazenar as informações do usuário
let userInfo = {};

// Função para obter empresa pelo domínio
async function getEmpresaByDomain(domain) {
    try {
        const domainData = await Domain.findOne({ domains: { $in: [domain] } }); // Busca no array de domínios
        return domainData ? domainData.empresa : null;
    } catch (error) {
        console.error("Erro ao obter informações do domínio:", error.message);
        return null;
    }
}

// Função para gerar um número de protocolo único
async function generateProtocolNumber() {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[-:.TZ]/g, '');
    const randomDigits = Math.floor(100 + Math.random() * 900); // Gera 3 dígitos aleatórios
    const protocolNumber = `${formattedDate}${randomDigits}`;

    // Verifica se o número de protocolo já existe no banco de dados
    const existingProtocol = await SupportClient.findOne({ protocolNumber });
    if (existingProtocol) {
        return generateProtocolNumber(); // Gera um novo número se já existir
    }

    return protocolNumber;
}

router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, perfil_email, domain } = req.body; // Adicionado perfil_email

    try {
        // Se for uma mensagem do usuário após o formulário, apenas responde normalmente
        if (message && email) {
            console.log(`Nova mensagem de ${email}: ${message}`);
            
            // Obter o usuário pelo perfil_email
            const user = await User.findOne({ email: perfil_email });

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            // Obter os dados da empresa com base no tipo "documento"
            const empresaData = await getEmpresaData(user.empresa, "documento");

            // Cria um contexto para o modelo entender quem está falando
            const userContext = `Dados do usuario do sistema, Nome: ${user.nome}, E-mail: ${user.email}, Empresa: ${user.empresa}, Licença: ${user.licenca}, Plano: ${user.plano}, Dados: ${JSON.stringify(user.dados)}, Criado em: ${user.createdAt}, Atualizado em: ${user.updatedAt}.`;

            // Verifica o limite de caracteres baseado no plano do usuário
            const charLimit = planLimits[user.plano] || 1000;

            // Instrução para a IA respeitar o limite de caracteres e destacar títulos
            const instruction = `Responda de forma direta e curta, sem ultrapassar ${charLimit} caracteres. Sempre que for gerar um título, destaque o começo e o final do título com "#" a depender do tamanho que você escolher para o <h>.`;

            // Adiciona os dados da empresa ao contexto
            const empresaContext = `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}`;

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

            // Envia a mensagem com contexto e instrução para a IA
            const result = await chat.sendMessage(`${userContext}\n\nInstrução: ${instruction}\n\n${empresaContext}\n\nUsuário: ${message}`);
            const response = await result.response();
            let botMessage = response.text();

            return res.json({ reply: botMessage });
        }

        // Se ainda não temos um domínio armazenado, buscamos a empresa associada
        if (domain) {
            console.log(`Domínio recebido: ${domain}`);
            
            // Obter a empresa com base no domínio
            const empresa = await getEmpresaByDomain(domain);
            
            if (empresa) {
                userInfo.empresa = empresa;
                console.log(`Empresa associada ao domínio: ${empresa}`);
            } else {
                console.log('Empresa associada ao domínio não encontrada.');
                return res.json({ reply: "Domínio não registrado no sistema." });
            }
        }

        // Armazena os dados do usuário caso ainda não estejam preenchidos
        if (firstName) userInfo.firstName = firstName;
        if (lastName) userInfo.lastName = lastName;
        if (cpf) userInfo.cpf = cpf;
        if (email) userInfo.email = email;
        if (perfil_email) userInfo.perfil_email = perfil_email; // Adicionando o perfil_email
        userInfo.domain = domain;

        // Verifica se todas as informações foram coletadas antes de responder
        if (!userInfo.firstName || !userInfo.lastName || !userInfo.cpf || !userInfo.email || !userInfo.empresa || !userInfo.perfil_email) {
            return res.json({ reply: "Por favor, forneça todas as informações antes de continuar." });
        }

        // Gera um número de protocolo único
        const protocolNumber = await generateProtocolNumber();

        // Conecta ao banco de dados principal
        const db = mongoose.connection.useDb('aurora_db');
        const collectionName = `data_${userInfo.empresa}`;

        // Cria um novo documento na coleção da empresa conforme o modelo
        const SupportClientModel = db.model('SupportClient', SupportClient.schema);
        const newSupportClient = new SupportClientModel({
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            cpf: userInfo.cpf,
            tipo:"chamado",
            email: userInfo.email,
            domain: userInfo.domain,
            protocolNumber,
            status: "Em atendimento(Aurora)",
            observacao: "",
            messages: []
        });
        await newSupportClient.save();

        // Responde com o número de protocolo
        return res.json({
            reply: `Obrigado por esperar, ${userInfo.firstName}. Me chamo Aurora, segue o número de protocolo do seu chamado: ${protocolNumber}. Como posso te ajudar?`,
            userInfo
        });

    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;