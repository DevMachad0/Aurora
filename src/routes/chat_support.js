const express = require('express');
const router = express.Router();

// Variável para armazenar as informações do usuário
let userInfo = {};

// Rota para receber mensagens do chat
router.post('/chat-support', (req, res) => {
    const { message, firstName, lastName, cpf, email } = req.body;

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
