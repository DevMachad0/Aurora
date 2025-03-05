const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importar o modelo de domínio

// Variável para armazenar as informações do usuário
let userInfo = {};

// Função para obter empresa pelo domínio
async function getEmpresaByDomain(domain) {
    try {
        const domainData = await Domain.findOne({ domains: { $in: [domain] } });
        return domainData ? domainData.empresa : null;
    } catch (error) {
        console.error('Erro ao obter informações do domínio:', error.message);
        return null;
    }
}

// ...existing code...
router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, domain } = req.body;

    try {
        // Se ainda não temos um domínio armazenado, buscamos a empresa associada
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

        // Verifica se todas as informações foram coletadas antes de responder
        if (!userInfo.firstName || !userInfo.lastName || !userInfo.cpf || !userInfo.email) {
            return res.json({ reply: "Por favor, forneça todas as informações antes de continuar." });
        }

        // Se tudo estiver preenchido, retornamos a resposta correta
        return res.json({
            reply: `Obrigado, ${userInfo.firstName}! Seu e-mail é ${userInfo.email}, seu CPF é ${userInfo.cpf} e seu domínio é ${userInfo.domain}. Por favor, descreva seu problema.`,
            userInfo
        });

    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;
