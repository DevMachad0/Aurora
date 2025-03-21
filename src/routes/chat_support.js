const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel');
const SupportClient = require('../models/supportClientModel');
const mongoose = require('mongoose');
const aurora = require('./chat_support_bot');
const { getEmpresaData } = require('../services/chatService');

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

router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, perfil_email, domain } = req.body;

    // Verificar campos obrigatórios
    const missingFields = [];
    if (!message) missingFields.push("message");
    if (!firstName) missingFields.push("firstName");
    if (!lastName) missingFields.push("lastName");
    if (!cpf) missingFields.push("cpf");
    if (!email) missingFields.push("email");
    if (!perfil_email) missingFields.push("perfil_email");
    if (!domain) missingFields.push("domain");

    if (missingFields.length > 0) {
        console.error(`Campos ausentes na requisição: ${missingFields.join(", ")}`);
        return res.status(400).json({ error: `Campos ausentes: ${missingFields.join(", ")}` });
    }

    try {
        // Obter informações do perfil
        let userInfo = {};
        if (perfil_email) {
            const userProfile = await getPerfilFromAuroraDB(perfil_email);
            if (userProfile) {
                userInfo = {
                    empresa: userProfile.empresa,
                    database: userProfile.database,
                    dados: userProfile.dados,
                };
            } else {
                return res.status(404).json({ reply: "Perfil_email não registrado no sistema." });
            }
        }

        // Adicionar informações do usuário
        userInfo = {
            ...userInfo,
            firstName,
            lastName,
            cpf,
            email,
            perfil_email,
            domain,
            protocolNumber: await generateProtocolNumber(),
        };

        // Verificar se o nome do banco de dados está definido
        if (!userInfo.database) {
            return res.status(400).json({ error: "Nome do banco de dados não encontrado." });
        }

        // Sanitizar o nome do banco de dados
        const sanitizedDatabaseName = userInfo.database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const atendimentoCollection = "atendimento";

        // Dados do atendimento
        const atendimentoData = {
            protocolNumber: userInfo.protocolNumber,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            cpf: userInfo.cpf,
            email: userInfo.email,
            domain: userInfo.domain,
            status: "Em atendimento(Aurora)",
            messages: [{ sender: "user", text: message }],
            createdAt: new Date(),
        };

        // Inserir dados no banco de dados
        const empresaDb = mongoose.connection.useDb(sanitizedDatabaseName);
        const atendimentoCollections = await empresaDb.db.listCollections({ name: atendimentoCollection }).toArray();
        if (atendimentoCollections.length === 0) {
            await empresaDb.createCollection(atendimentoCollection);
        }
        await empresaDb.collection(atendimentoCollection).insertOne(atendimentoData);

        // Obter dados da empresa e enviar para a Aurora
        const documentosData = await empresaDb.collection("documentos").findOne({ tipo: "documento" });
        const empresaContext = documentosData
            ? `Dados da empresa: Nome: ${documentosData.nome}, Conteúdo: ${documentosData.conteudo.join(", ")}`
            : "Dados da empresa não encontrados.";
        const dadosContext = userInfo.dados
            ? `Instruções adicionais: ${userInfo.dados.join(", ")}`
            : "Instruções adicionais não encontradas.";
        const initialMessage = `Obrigado por esperar, ${userInfo.firstName}. Me chamo Aurora, segue o número de protocolo do seu chamado: ${userInfo.protocolNumber}. Como posso te ajudar?`;
        const userContext = `Nome: ${userInfo.firstName}, Sobrenome: ${userInfo.lastName}, CPF: ${userInfo.cpf}, Email: ${userInfo.email}`;
        const botResponse = await aurora.getResponse(`${userContext}\n\n${empresaContext}\n\n${dadosContext}\n\n${message}\n\n${initialMessage}`);

        // Atualizar atendimento com a resposta da Aurora
        await empresaDb.collection(atendimentoCollection).updateOne(
            { protocolNumber: userInfo.protocolNumber },
            { $push: { messages: { sender: "bot", text: botResponse } } }
        );

        return res.json({ reply: botResponse });
    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;