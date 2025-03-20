const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio
const SupportClient = require('../models/supportClientModel'); // Importar o modelo de suporte ao cliente
const mongoose = require('mongoose');
const aurora = require('./chat_support_bot'); // Importar o modelo Aurora
const { getEmpresaData } = require('../services/chatService'); // Importar a função para obter dados da empresa
const { getUserProfileData } = require('../services/userService'); // Importar a função para obter dados do perfil do usuário
const { getAuroraCoreData } = require('../services/auroraCoreService'); // Importar o serviço Aurora Core

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

// Função para obter empresa pelo perfil_email
async function getEmpresaByPerfilEmail(perfil_email) {
    try {
        const domainData = await Domain.findOne({ emails: { $in: [perfil_email] } }); // Busca no array de emails
        return domainData ? domainData.empresa : null;
    } catch (error) {
        console.error("Erro ao obter informações pelo perfil_email:", error.message);
        return null;
    }
}

// Função para obter informações do perfil no banco de dados aurora_db
async function getPerfilFromAuroraDB(perfil_email) {
    try {
        const auroraDb = mongoose.connection.useDb("aurora_db");
        const user = await auroraDb.collection("users").findOne({ email: perfil_email });
        return user;
    } catch (error) {
        console.error("Erro ao buscar perfil no banco aurora_db:", error.message);
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
    const { message, firstName, lastName, cpf, email, perfil_email, domain } = req.body;

    try {
        // Verifica se a mensagem foi enviada
        if (!message) {
            return res.status(400).json({ reply: "Por favor, envie uma mensagem para continuar." });
        }

        // Obter o perfil no banco de dados aurora_db
        if (perfil_email && (!userInfo.empresa || !userInfo.database)) {
            const userProfile = await getPerfilFromAuroraDB(perfil_email);
            if (userProfile) {
                userInfo.empresa = userProfile.empresa;
                userInfo.database = userProfile.database;
                userInfo.dados = userProfile.dados; // Adiciona os dados do perfil
                console.log(`Perfil encontrado: Empresa - ${userInfo.empresa}, Database - ${userInfo.database}`);
            } else {
                console.log('Perfil associado ao perfil_email não encontrado.');
                return res.json({ reply: "Perfil_email não registrado no sistema." });
            }
        }

        // Verifica se todas as informações necessárias foram coletadas
        if (!userInfo.empresa || !userInfo.database) {
            return res.json({ reply: "Não foi possível determinar a empresa ou o banco de dados associado." });
        }

        // Armazena os dados do usuário caso ainda não estejam preenchidos
        if (firstName) userInfo.firstName = firstName;
        if (lastName) userInfo.lastName = lastName;
        if (cpf) userInfo.cpf = cpf;
        if (email) userInfo.email = email;
        if (perfil_email) userInfo.perfil_email = perfil_email;
        userInfo.domain = domain;

        // Gera um número de protocolo único apenas se ainda não existir
        if (!userInfo.protocolNumber) {
            userInfo.protocolNumber = await generateProtocolNumber();
        }

        // Sanitizar o nome do banco de dados
        const sanitizedDatabaseName = userInfo.database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const atendimentoCollection = "atendimento";
        const documentosCollection = "documentos";

        try {
            const empresaDb = mongoose.connection.useDb(sanitizedDatabaseName);

            // Obtém os dados da coleção "documentos"
            const documentosData = await empresaDb.collection(documentosCollection).findOne({ tipo: "documento" });
            const empresaContext = documentosData
                ? `Dados da empresa: Nome: ${documentosData.nome}, Conteúdo: ${documentosData.conteudo.join(", ")}`
                : "Dados da empresa não encontrados.";

            // Adiciona os dados do perfil como instruções adicionais
            const dadosContext = userInfo.dados
                ? `Instruções adicionais: ${userInfo.dados.join(", ")}`
                : "Instruções adicionais não encontradas.";

            // Envia a mensagem para a IA Aurora
            const userContext = `Nome: ${userInfo.firstName}, Sobrenome: ${userInfo.lastName}, CPF: ${userInfo.cpf}, Email: ${userInfo.email}`;
            const initialMessage = `Protocolo: ${userInfo.protocolNumber}. Mensagem do usuário: ${message}`;
            const botResponse = await aurora.getResponse(`${userContext}\n\n${empresaContext}\n\n${dadosContext}\n\n${initialMessage}`);

            // Salva a mensagem no banco de dados
            const atendimento = await empresaDb.collection(atendimentoCollection).findOne({ protocolNumber: userInfo.protocolNumber });
            if (!atendimento) {
                const atendimentoData = {
                    protocolNumber: userInfo.protocolNumber,
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName,
                    cpf: userInfo.cpf,
                    email: userInfo.email,
                    domain: userInfo.domain,
                    status: "Em atendimento(Aurora)",
                    messages: [{ sender: "cliente", message, timestamp: new Date() }],
                    createdAt: new Date(),
                };
                await empresaDb.collection(atendimentoCollection).insertOne(atendimentoData);
            } else {
                await empresaDb.collection(atendimentoCollection).updateOne(
                    { protocolNumber: userInfo.protocolNumber },
                    { $push: { messages: { sender: "cliente", message, timestamp: new Date() } } }
                );
            }

            // Adiciona a resposta da IA ao histórico
            await empresaDb.collection(atendimentoCollection).updateOne(
                { protocolNumber: userInfo.protocolNumber },
                { $push: { messages: { sender: "Aurora", message: botResponse, timestamp: new Date() } } }
            );

            return res.json({ reply: botResponse });
        } catch (error) {
            console.error('Erro ao acessar ou salvar dados no banco de dados:', error);
            return res.status(500).json({ error: "Erro ao acessar ou salvar dados no banco de dados." });
        }
    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;