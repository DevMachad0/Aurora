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

function getHoraBrasil() {
    return moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");
}

async function verificarLembretes() {
    try {
        const agora = moment().tz("America/Sao_Paulo");
        console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Iniciando verificação de lembretes...`);
        console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Data e hora atual no Brasil: ${agora.format("YYYY-MM-DD HH:mm:ss")}`);

        const eventos = await LembreteEvento.find({
            notifyEmail: true,
            status: { $in: ["evento criado", "lembrete enviado"] },
        });

        console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Eventos encontrados para verificação: ${eventos.length}`);

        for (const evento of eventos) {
            const eventoDataHora = moment.tz(`${evento.date} ${evento.startTime}`, "YYYY-MM-DD HH:mm", "America/Sao_Paulo");
            const diffMinutos = eventoDataHora.diff(agora, "minutes");

            console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Verificando evento: ${evento.title}`);
            console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Diferença em minutos para o evento: ${diffMinutos}`);

            let mailOptions;

            if (diffMinutos === 30 && evento.status === "evento criado") {
                // Lembrete 30 minutos antes
                mailOptions = {
                    from: "lembrete.agendamento.aurora@gmail.com",
                    to: evento.email,
                    subject: `Lembrete de Evento: ${evento.title} - Faltam 30 minutos`,
                    text: `
                        Olá,

                        Este é um lembrete para o evento que você criou. Faltam 30 minutos para o início do evento.

                        Título: ${evento.title}
                        Data: ${evento.date}
                        Hora de Início: ${evento.startTime}
                        Hora de Fim: ${evento.endTime}
                        Descrição: ${evento.description}

                        Atenciosamente,
                        Equipe Aurora
                    `,
                };

                evento.status = "lembrete enviado";
            } else if (diffMinutos === 0 && evento.status === "lembrete enviado") {
                // Lembrete na hora do evento
                mailOptions = {
                    from: "lembrete.agendamento.aurora@gmail.com",
                    to: evento.email,
                    subject: `Lembrete de Evento: ${evento.title} - Agora`,
                    text: `
                        Olá,

                        Este é um lembrete para o evento que você criou. O evento está começando agora.

                        Título: ${evento.title}
                        Data: ${evento.date}
                        Hora de Início: ${evento.startTime}
                        Hora de Fim: ${evento.endTime}
                        Descrição: ${evento.description}

                        Atenciosamente,
                        Equipe Aurora
                    `,
                };

                evento.status = "evento lembrado";
            }

            if (mailOptions) {
                try {
                    console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Enviando e-mail para ${evento.email} sobre o evento ${evento.title}`);
                    await transporter.sendMail(mailOptions);
                    console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] E-mail enviado com sucesso para ${evento.email}`);
                    await evento.save();
                } catch (error) {
                    console.error(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Erro ao enviar e-mail para ${evento.email}:`, error);
                }
            } else {
                console.log(`[${agora.format("YYYY-MM-DD HH:mm:ss")}] Nenhum e-mail enviado para o evento: ${evento.title}`);
            }
        }
    } catch (error) {
        console.error(`[${getHoraBrasil()}] Erro ao verificar lembretes:`, error);
    }
}

module.exports = { verificarLembretes };
