const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const LembreteEvento = require("../models/lembreteEventoModel");

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // Servidor SMTP do Hotmail/Outlook
    port: 587,
    secure: false, // Usar TLS
    auth: {
        user: process.env.HOTMAIL_USER, // E-mail do Hotmail
        pass: process.env.HOTMAIL_PASSWORD, // Senha de aplicativo do Hotmail
    },
});

function getDataAtualBrasil() {
    return moment().tz("America/Sao_Paulo").format("YYYY-MM-DD");
}

async function verificarLembretes() {
    try {
        const dataAtual = getDataAtualBrasil();
        console.log(`[${dataAtual}] Iniciando verificação de lembretes...`);

        const eventos = await LembreteEvento.find({
            notifyEmail: true,
            status: "evento criado",
            date: dataAtual, // Verifica eventos com a data atual
        });

        console.log(`[${dataAtual}] Eventos encontrados para verificação: ${eventos.length}`);

        for (const evento of eventos) {
            console.log(`[${dataAtual}] Enviando lembrete para o evento: ${evento.title}`);

            const mailOptions = {
                from: process.env.HOTMAIL_USER, // E-mail do remetente
                to: evento.email,
                subject: `Lembrete de Evento: ${evento.title} - ${evento.date}`,
                text: `
                    Olá,

                    Este é um lembrete para o evento que você criou.

                    Título: ${evento.title}
                    Data: ${evento.date}
                    Hora de Início: ${evento.startTime}
                    Hora de Fim: ${evento.endTime}
                    Descrição: ${evento.description}

                    Atenciosamente,
                    Equipe Aurora
                `,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`[${dataAtual}] E-mail enviado com sucesso para ${evento.email}`);

                // Atualizar o status do evento para "evento lembrado"
                evento.status = "evento lembrado";
                await evento.save();
            } catch (error) {
                console.error(`[${dataAtual}] Erro ao enviar e-mail para ${evento.email}:`, error);
            }
        }
    } catch (error) {
        console.error(`[${getDataAtualBrasil()}] Erro ao verificar lembretes:`, error);
    }
}

module.exports = { verificarLembretes };
