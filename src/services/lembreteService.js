const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const LembreteEvento = require("../models/lembreteEventoModel");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "lembrete.agendamento.aurora@gmail.com",
        pass: process.env.EMAIL_PASSWORD, // Definir a senha no arquivo .env
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
                from: "lembrete.agendamento.aurora@gmail.com",
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
