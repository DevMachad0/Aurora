const express = require('express');
const router = express.Router();
const Domain = require('../models/domainModel'); // Importa o modelo de domínio

// Variável para armazenar as informações do usuário
let userInfo = {};

// Rota para receber mensagens do chat
router.post('/chat-support', async (req, res) => {
    const { message, firstName, lastName, cpf, email, domain } = req.body;

    try {
        // Verifica se o domínio está no banco de dados
        const domainData = await Domain.findOne({ domains: domain });

        if (domainData) {
            // Armazena a empresa baseada no domínio
            const empresa = domainData.empresa;
            console.log(`Empresa associada ao domínio ${domain}: ${empresa}`);

            // Armazenando o domínio e empresa se ainda não estiverem armazenados
            if (domain && !userInfo.domain) {
                userInfo.domain = domain;
                userInfo.empresa = empresa;
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
        } else {
            res.json({
                reply: "Não foi possível estabelecer uma conexão. Domínio não encontrado."
            });
        }
    } catch (error) {
        console.error("Erro ao verificar domínio:", error);
        res.status(500).json({ error: "Erro ao verificar domínio." });
    }
});

module.exports = router;
