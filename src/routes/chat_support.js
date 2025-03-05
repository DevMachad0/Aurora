const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio

// Variável para armazenar as informações do usuário
let userInfo = {};

// Função para obter empresa pelo domínio
async function getEmpresaByDomain(domain) {
    try {
        const domainData = await Domain.findOne({ domains: domain });
        return domainData ? domainData.empresa : null;
    } catch (error) {
        console.error('Erro ao obter informações do domínio:', error.message);
        return null;
    }
}

// Rota para receber mensagens do chat
router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, domain } = req.body;

    // Armazena e consulta o domínio apenas se ainda não estiver armazenado
    if (domain && !userInfo.domain) {
        userInfo.domain = domain;
        console.log(`Domínio recebido: ${domain}`);

        userInfo.empresa = await getEmpresaByDomain(domain);
        console.log(`Empresa associada ao domínio: ${userInfo.empresa || 'não encontrada'}`);
    }

    // Armazena os dados do usuário caso ainda não estejam preenchidos
    if (firstName && !userInfo.firstName) userInfo.firstName = firstName;
    if (lastName && !userInfo.lastName) userInfo.lastName = lastName;
    if (cpf && !userInfo.cpf) userInfo.cpf = cpf;
    if (email && !userInfo.email) userInfo.email = email;

    // Verifica se todos os campos do formulário foram preenchidos
    if (userInfo.firstName && userInfo.lastName && userInfo.cpf && userInfo.email) {
        res.json({
            reply: `Obrigado, ${userInfo.firstName}! Empresa: ${userInfo.empresa || 'Não encontrada'}. Como posso te ajudar?`,
            domainValidation: `Domínio recebido: ${userInfo.domain}, Empresa associada: ${userInfo.empresa || 'não encontrada'}`
        });
    } else {
        // Processa a mensagem normalmente
        res.json({
            reply: `Recebi sua mensagem: "${message}"`,
            domainValidation: `Domínio recebido: ${userInfo.domain}, Empresa associada: ${userInfo.empresa || 'não encontrada'}`
        });
    }
});

module.exports = router;
