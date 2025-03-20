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
            
            // Envia a mensagem com os dados do usuário para a IA Aurora
            const userContext = `Nome: ${userInfo.firstName}, Sobrenome: ${userInfo.lastName}, CPF: ${userInfo.cpf}, Email: ${userInfo.email}`;
            const empresaData = await getEmpresaData(userInfo.empresa, "documento");
            const empresaContext = empresaData ? `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}` : "Dados da empresa não encontrados.";
            const userProfileData = await getUserProfileData(userInfo.perfil_email);
            const profileContext = userProfileData ? `Ultilizar dados do perfil: ${userProfileData.join(", ")}, que se referem ao atendimento ao cliente via (API)` : "Dados do perfil não encontrados.";
            const botResponse = await aurora.getResponse(`${userContext}\n\n${empresaContext}\n\n${profileContext}\n\n${message}`);

            // Sanitizar o nome do banco de dados
            const sanitizedDatabaseName = `data_${userInfo.empresa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
            const atendimentoCollection = "atendimento";

            // Salvar a mensagem trocada entre o cliente e a AURORA
            if (message) {
                try {
                    const empresaDb = mongoose.connection.useDb(sanitizedDatabaseName);
                    const atendimento = await empresaDb.collection(atendimentoCollection).findOne({ protocolNumber: userInfo.protocolNumber });

                    if (!atendimento) {
                        return res.status(404).json({ error: "Atendimento não encontrado." });
                    }

                    const newMessage = {
                        sender: email ? "cliente" : "AURORA",
                        message,
                        timestamp: new Date(),
                    };

                    await empresaDb.collection(atendimentoCollection).updateOne(
                        { protocolNumber: userInfo.protocolNumber },
                        { $push: { messages: newMessage } }
                    );

                    console.log('Mensagem salva com sucesso no atendimento.');
                } catch (error) {
                    console.error('Erro ao salvar a mensagem no atendimento:', error);
                    return res.status(500).json({ error: "Erro ao salvar a mensagem no banco de dados." });
                }
            }

            return res.json({ reply: botResponse });
        }

        // Obter a empresa correta com base no perfil_email
        if (perfil_email) {
            const empresa = await getEmpresaByPerfilEmail(perfil_email);
            if (empresa) {
                userInfo.empresa = empresa;
                console.log(`Empresa associada ao perfil_email: ${empresa}`);
            } else {
                console.log('Empresa associada ao perfil_email não encontrada.');
                return res.json({ reply: "Perfil_email não registrado no sistema." });
            }
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
        userInfo.protocolNumber = protocolNumber;

        // Sanitizar o nome do banco de dados
        const sanitizedDatabaseName = `data_${userInfo.empresa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
        const atendimentoCollection = "atendimento";

        // Cria um novo documento na coleção "atendimento" da empresa
        const atendimentoData = {
            protocolNumber,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            cpf: userInfo.cpf,
            email: userInfo.email,
            domain: userInfo.domain,
            status: "Em atendimento(Aurora)",
            messages: [],
            createdAt: new Date(),
        };

        try {
            const empresaDb = mongoose.connection.useDb(sanitizedDatabaseName);
            const collections = await empresaDb.db.listCollections({ name: atendimentoCollection }).toArray();
            if (collections.length === 0) {
                await empresaDb.createCollection(atendimentoCollection);
            }
            await empresaDb.collection(atendimentoCollection).insertOne(atendimentoData);
            console.log('Atendimento salvo com sucesso na coleção "atendimento".');
        } catch (error) {
            console.error('Erro ao salvar o atendimento na coleção "atendimento":', error);
            return res.status(500).json({ error: "Erro ao salvar o atendimento no banco de dados da empresa." });
        }

        // Responde com o número de protocolo
        res.json({
            reply: `Obrigado por esperar, ${userInfo.firstName}. Me chamo Aurora, segue o número de protocolo do seu chamado: ${protocolNumber}. Como posso te ajudar?`,
            userInfo
        });

        // Obter as instruções e restrições do Aurora Core
        const auroraCoreData = await getAuroraCoreData();
        const coreInstructions = auroraCoreData.instructions.join("\n");
        const coreRestrictions = auroraCoreData.restrictions.join("\n");

        // Envia a mensagem inicial para o modelo Aurora com os dados do usuário, da empresa, do perfil e do Aurora Core
        const initialMessage = `Obrigado por esperar, ${userInfo.firstName}. Me chamo Aurora, segue o número de protocolo do seu chamado: ${userInfo.protocolNumber}. Como posso te ajudar?`;
        const userContext = `Nome: ${userInfo.firstName}, Sobrenome: ${userInfo.lastName}, CPF: ${userInfo.cpf}, Email: ${userInfo.email}`;
        const empresaData = await getEmpresaData(userInfo.empresa, "documento");
        const empresaContext = empresaData ? `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}` : "Dados da empresa não encontrados.";
        const userProfileData = await getUserProfileData(userInfo.perfil_email);
        const profileContext = userProfileData ? `Dados do perfil: ${userProfileData.join(", ")}` : "Dados do perfil não encontrados.";

        await aurora.getResponse(`${userContext}\n\n${empresaContext}\n\n${profileContext}\n\nInstruções do Aurora Core:\n${coreInstructions}\n\nRestrições do Aurora Core:\n${coreRestrictions}\n\n${initialMessage}`);

    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;