const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio
const SupportClient = require('../models/supportClientModel'); // Importar o modelo de suporte ao cliente
const mongoose = require('mongoose');

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
            
            // Simulação de resposta do assistente de IA
            const botResponse = `Recebi sua mensagem: "${message}". Estamos analisando sua solicitação.`;

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

        // Conecta ao banco de dados principal
        const db = mongoose.connection.useDb('aurora_db');
        const collectionName = `data_${userInfo.empresa}`;

        // Cria um novo documento na coleção da empresa conforme o modelo
        const newSupportClient = {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            cpf: userInfo.cpf,
            tipo: "chamado",
            email: userInfo.email,
            domain: userInfo.domain,
            protocolNumber,
            status: "Em atendimento(Aurora)",
            observacao: "",
            messages: []
        };

        try {
            await db.collection(collectionName).insertOne(newSupportClient);
            console.log('Protocolo salvo com sucesso:', protocolNumber);
        } catch (error) {
            console.error('Erro ao salvar o protocolo:', error);
            return res.status(500).json({ error: "Erro ao salvar o protocolo no banco de dados." });
        }

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