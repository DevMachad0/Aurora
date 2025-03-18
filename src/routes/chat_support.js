const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio
const SupportClient = require('../models/supportClientModel'); // Importar o modelo de suporte ao cliente
const mongoose = require('mongoose');
const aurora = require('./chat_support_bot'); // Importar o modelo Aurora
const { getEmpresaData } = require('../services/chatService'); // Importar a função para obter dados da empresa
const { getUserProfileData } = require('../services/userService'); // Importar a função para obter dados do perfil do usuário

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
            
            // Envia a mensagem com os dados do usuário para a IA Aurora
            const userContext = `Nome: ${userInfo.firstName}, Sobrenome: ${userInfo.lastName}, CPF: ${userInfo.cpf}, Email: ${userInfo.email}`;
            const empresaData = await getEmpresaData(userInfo.empresa, "documento");
            const empresaContext = empresaData ? `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}` : "Dados da empresa não encontrados.";
            const userProfileData = await getUserProfileData(userInfo.perfil_email);
            const profileContext = userProfileData ? `Ultilizar dados do perfil: ${userProfileData.join(", ")}, que se referem ao atendimento ao cliente via (API)` : "Dados do perfil não encontrados.";
            const botResponse = await aurora.getResponse(`${userContext}\n\n${empresaContext}\n\n${profileContext}\n\n${message}`);

            return res.json({ reply: botResponse });
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

        // Envia a mensagem inicial para o modelo Aurora com os dados do usuário, da empresa e do perfil
        const initialMessage = `Obrigado por esperar, ${userInfo.firstName}. Me chamo Aurora, segue o número de protocolo do seu chamado: ${protocolNumber}. Como posso te ajudar?`;
        const userContext = `Nome: ${userInfo.firstName}, Sobrenome: ${userInfo.lastName}, CPF: ${userInfo.cpf}, Email: ${userInfo.email}`;
        const empresaData = await getEmpresaData(userInfo.empresa, "documento");
        const empresaContext = empresaData ? `Dados da empresa: Nome: ${empresaData.nome}, Conteúdo: ${empresaData.conteudo.join(", ")}` : "Dados da empresa não encontrados.";
        const userProfileData = await getUserProfileData(userInfo.perfil_email);
        const profileContext = userProfileData ? `Dados do perfil: ${userProfileData.join(", ")}` : "Dados do perfil não encontrados.";
        await aurora.getResponse(`${userContext}\n\n${empresaContext}\n\n${profileContext}\n\n${initialMessage}`);

    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;