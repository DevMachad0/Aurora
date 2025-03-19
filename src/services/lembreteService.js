const nodemailer = require("nodemailer");
const LembreteEvento = require("../models/lembreteEventoModel");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "lembrete.agendamento.aurora@gmail.com",
        pass: process.env.EMAIL_PASSWORD, // Definir a senha no arquivo .env
    },
});

async function verificarLembretes() {
    try {
        const agora = new Date();
        const eventos = await LembreteEvento.find({
            notifyEmail: true,
            status: { $in: ["evento criado", "lembrete enviado"] },
            date: { $gte: agora.toISOString().split("T")[0] },
        });

        for (const evento of eventos) {
            const eventoDataHora = new Date(`${evento.date}T${evento.startTime}`);
            const diffMinutos = Math.floor((eventoDataHora - agora) / (1000 * 60));

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
                    await transporter.sendMail(mailOptions);
                    console.log(`E-mail enviado para ${evento.email} sobre o evento ${evento.title}`);
                    await evento.save();
                } catch (error) {
                    console.error(`Erro ao enviar e-mail para ${evento.email}:`, error);
                }
            }
        }
    } catch (error) {
        console.error("Erro ao verificar lembretes:", error);
    }
}

module.exports = { verificarLembretes };
