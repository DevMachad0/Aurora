const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Modelo de domínio
const SupportClient = require('../models/supportClientModel'); // Modelo de suporte ao cliente
const mongoose = require('mongoose');
const aurora = require('./chat_support_bot'); // IA Aurora
const { getPerfilFromAuroraDB } = require('../services/userService'); // Importar serviço de perfil

// Função para gerar um número de protocolo único
async function generateProtocolNumber() {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[-:.TZ]/g, '');
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const protocolNumber = `${formattedDate}${randomDigits}`;

    // Verifica se o protocolo já existe
    const existingProtocol = await SupportClient.findOne({ protocolNumber });
    if (existingProtocol) {
        return generateProtocolNumber();
    }
    return protocolNumber;
}

router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, perfil_email, domain } = req.body;

    try {
        // Obter informações do perfil no banco aurora_db
        let userInfo = {};
        if (perfil_email) {
            const userProfile = await getPerfilFromAuroraDB(perfil_email);
            if (userProfile) {
                userInfo = {
                    empresa: userProfile.empresa,
                    database: userProfile.database,
                    dados: userProfile.dados || [],
                    firstName,
                    lastName,
                    cpf,
                    email,
                    perfil_email,
                    domain
                };
            } else {
                return res.json({ reply: "Perfil_email não registrado no sistema." });
            }
        }

        if (!userInfo.empresa || !userInfo.database) {
            return res.json({ reply: "Não foi possível determinar a empresa ou o banco de dados associado." });
        }

        // Sanitizar o nome do banco de dados
        const sanitizedDatabaseName = userInfo.database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const empresaDb = mongoose.connection.useDb(sanitizedDatabaseName);
        const atendimentoCollection = "atendimento";
        const documentosCollection = "documentos";

        // Verificar se já existe um atendimento ativo para o usuário
        let atendimentoData = await empresaDb.collection(atendimentoCollection).findOne({ email: userInfo.email, status: "Em atendimento(Aurora)" });

        if (!atendimentoData) {
            // Criar um novo atendimento se não existir
            const protocolNumber = await generateProtocolNumber();
            atendimentoData = {
                protocolNumber,
                ...userInfo,
                status: "Em atendimento(Aurora)",
                messages: [],
                createdAt: new Date()
            };

            await empresaDb.collection(atendimentoCollection).insertOne(atendimentoData);
        }

        // Adicionar nova mensagem ao histórico
        const userMessage = { sender: "user", text: message, timestamp: new Date() };
        atendimentoData.messages.push(userMessage);

        // Construir histórico da conversa
        let conversationHistory = atendimentoData.messages
            .map(msg => `${msg.sender === "user" ? "Usuário" : "Aurora"}: ${msg.text}`)
            .join("\n");

        // Buscar contexto da empresa
        const documentosData = await empresaDb.collection(documentosCollection).findOne({ tipo: "documento" });
        const empresaContext = documentosData
            ? `Dados da empresa: Nome: ${documentosData.nome}, Conteúdo: ${documentosData.conteudo.join(", ")}`
            : "Dados da empresa não encontrados.";

        // Buscar dados adicionais do usuário
        const dadosContext = userInfo.dados.length > 0 ? `Instruções adicionais: ${userInfo.dados.join(", ")}` : "Instruções adicionais não encontradas.";

        // Enviar mensagem para a IA Aurora
        const botResponseText = await aurora.getResponse(`${conversationHistory}\n\n${empresaContext}\n\n${dadosContext}\n\nUsuário: ${message}`);

        // Adicionar resposta da IA ao histórico
        const botMessage = { sender: "aurora", text: botResponseText, timestamp: new Date() };
        atendimentoData.messages.push(botMessage);

        // Atualizar o atendimento no banco de dados
        await empresaDb.collection(atendimentoCollection).updateOne(
            { protocolNumber: atendimentoData.protocolNumber },
            { $set: { messages: atendimentoData.messages } }
        );

        return res.json({ reply: botResponseText });

    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;
