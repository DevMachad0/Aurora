const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel');
const SupportClient = require('../models/supportClientModel');
const mongoose = require('mongoose');
const aurora = require('./chat_support_bot');
const { getEmpresaData } = require('../services/chatService');
const { getAuroraCoreData } = require('../services/auroraCoreService'); // Importar o serviço auroraCore

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
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const protocolNumber = `${formattedDate}${randomDigits}`;
    const existingProtocol = await SupportClient.findOne({ protocolNumber });
    return existingProtocol ? generateProtocolNumber() : protocolNumber;
}

// Variável para armazenar os dados do usuário durante a sessão
let sessionUserInfo = {};

router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, perfil_email, domain } = req.body;

    // Verificar campos obrigatórios apenas no envio inicial (sem mensagem)
    if (!message) {
        const missingFields = [];
        if (!firstName && !sessionUserInfo.firstName) missingFields.push("firstName");
        if (!lastName && !sessionUserInfo.lastName) missingFields.push("lastName");
        if (!cpf && !sessionUserInfo.cpf) missingFields.push("cpf");
        if (!email && !sessionUserInfo.email) missingFields.push("email");
        if (!perfil_email && !sessionUserInfo.perfil_email) missingFields.push("perfil_email");
        if (!domain && !sessionUserInfo.domain) missingFields.push("domain");

        if (missingFields.length > 0) {
            console.error(`Campos ausentes na requisição: ${missingFields.join(", ")}`);
            return res.status(400).json({ error: `Campos ausentes: ${missingFields.join(", ")}` });
        }
    }

    try {
        // Atualizar ou armazenar os dados do usuário na sessão
        sessionUserInfo = {
            ...sessionUserInfo,
            firstName: firstName || sessionUserInfo.firstName,
            lastName: lastName || sessionUserInfo.lastName,
            cpf: cpf || sessionUserInfo.cpf,
            email: email || sessionUserInfo.email,
            perfil_email: perfil_email || sessionUserInfo.perfil_email,
            domain: domain || sessionUserInfo.domain,
        };

        // Obter informações do perfil e dados da empresa
        const userProfile = await getPerfilFromAuroraDB(sessionUserInfo.perfil_email);
        if (!userProfile || !userProfile.database) {
            return res.status(400).json({ error: "Nome do banco de dados não encontrado." });
        }

        const empresaDados = userProfile.dados
            ? `Dados da empresa: ${userProfile.dados.join(", ")}`
            : "Dados da empresa não encontrados.";

        // Obter instruções e restrições do auroraCore
        const auroraCoreData = await getAuroraCoreData(sessionUserInfo.perfil_email);
        const instrucoesRestricoes = auroraCoreData
            ? `Instruções: ${auroraCoreData.instrucoes.join(", ")}. Restrições: ${auroraCoreData.restricoes.join(", ")}.`
            : "Instruções e restrições não encontradas.";

        // Caso seja uma mensagem para a IA
        if (message) {
            const userContext = `Nome: ${sessionUserInfo.firstName}, Sobrenome: ${sessionUserInfo.lastName}, CPF: ${sessionUserInfo.cpf}, Email: ${sessionUserInfo.email}`;
            const botResponse = await aurora.getResponse(`${userContext}\n\n${empresaDados}\n\n${instrucoesRestricoes}\n\n${message}`, sessionUserInfo.protocolNumber);
            return res.json({ reply: botResponse });
        }

        // Caso seja o envio inicial, gerar o protocolo e salvar no banco
        const protocolNumber = await generateProtocolNumber();
        sessionUserInfo.protocolNumber = protocolNumber;

        const sanitizedDatabaseName = userProfile.database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const atendimentoCollection = "atendimento";

        const atendimentoData = {
            protocolNumber,
            firstName: sessionUserInfo.firstName,
            lastName: sessionUserInfo.lastName,
            cpf: sessionUserInfo.cpf,
            email: sessionUserInfo.email,
            domain: sessionUserInfo.domain,
            status: "Em atendimento(Aurora)",
            messages: [],
            createdAt: new Date(),
        };

        const empresaDb = mongoose.connection.useDb(sanitizedDatabaseName);
        const atendimentoCollections = await empresaDb.db.listCollections({ name: atendimentoCollection }).toArray();
        if (atendimentoCollections.length === 0) {
            await empresaDb.createCollection(atendimentoCollection);
        }
        await empresaDb.collection(atendimentoCollection).insertOne(atendimentoData);

        return res.json({ reply: "Atendimento iniciado! Como podemos ajudar você?." });
    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;