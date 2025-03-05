const express = require('express');
const router = express.Router();
const axios = require('axios');

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
            const response = await axios.get('/get-domain-info', { params: { domain } });
            const { empresa } = response.data;
            console.log(`Empresa associada ao domínio: ${empresa}`);
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
            reply: `Obrigado, ${userInfo.firstName}! Como posso te ajudar?`
        });
    } else {
        // Processa a mensagem, aqui você pode adicionar lógica para IA ou outro processamento
        res.json({
            reply: `Recebi sua mensagem: "${message}"`
        });
    }
});

module.exports = router;
