const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio

// Variável para armazenar as informações do usuário
let userInfo = {};

// Rota para receber mensagens do chat
router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, domain } = req.body;

    // Armazenando o domínio se ainda não estiver armazenado
    if (domain && !userInfo.domain) {
        userInfo.domain = domain;
        console.log(`Domínio recebido: ${domain}`);

        // Obter informações do domínio e da empresa
        try {
            const domainData = await Domain.findOne({ domains: domain });
            if (domainData) {
                userInfo.empresa = domainData.empresa;
                console.log(`Empresa associada ao domínio: ${userInfo.empresa}`);
            } else {
                console.log('Domínio não encontrado');
            }
        } catch (error) {
            console.error('Erro ao obter informações do domínio:', error.message);
        }
    }

    // Se os dados do usuário ainda não estiverem preenchidos, armazenamos na variável
    if (firstName && !userInfo.firstName) {
        userInfo.firstName = firstName;
    }
    if (lastName && !userInfo.lastName) {
        userInfo.lastName = lastName;
    }
    if (cpf && !userInfo.cpf) {
        userInfo.cpf = cpf;
    }
    if (email && !userInfo.email) {
        userInfo.email = email;
    }

    // Verifica se todos os campos do formulário foram preenchidos
    if (userInfo.firstName && userInfo.lastName && userInfo.cpf && userInfo.email) {
        res.json({
            reply: `Obrigado, ${userInfo.firstName},${userInfo.domain},${userInfo.empresa}! Como posso te ajudar?`,
            domainValidation: `Domínio recebido: ${userInfo.domain}, Empresa associada: ${userInfo.empresa || 'não encontrada'}`
        });
    } else {
        // Processa a mensagem, aqui você pode adicionar lógica para IA ou outro processamento
        res.json({
            reply: `Recebi sua mensagem: "${message}"`,
            domainValidation: `Domínio recebido: ${userInfo.domain}, Empresa associada: ${userInfo.empresa || 'não encontrada'}`
        });
    }
});

module.exports = router;
