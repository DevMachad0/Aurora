const nodemailer = require("nodemailer");
const LembreteEvento = require("../models/lembreteEventoModel");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "lembrete.agendamento.aurora@gmail.com",
        pass: process.env.EMAIL_PASSWORD, // Definir a senha no arquivo .env
    },
});

function getHoraBrasil() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function verificarLembretes() {
    try {
        const agora = new Date();
        const horaBrasil = getHoraBrasil();
        console.log(`[${horaBrasil}] Iniciando verificação de lembretes...`);
        console.log(`[${horaBrasil}] Data e hora atual no Brasil: ${horaBrasil}`);

        const eventos = await LembreteEvento.find({
            notifyEmail: true,
            status: { $in: ["evento criado", "lembrete enviado"] },
            date: { $gte: agora.toISOString().split("T")[0] },
        });

        console.log(`[${horaBrasil}] Eventos encontrados para verificação: ${eventos.length}`);

        for (const evento of eventos) {
            const eventoDataHora = new Date(`${evento.date}T${evento.startTime}`);
            const diffMinutos = Math.floor((eventoDataHora - agora) / (1000 * 60));

            console.log(`[${horaBrasil}] Verificando evento: ${evento.title}`);
            console.log(`[${horaBrasil}] Diferença em minutos para o evento: ${diffMinutos}`);

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
                    console.log(`[${horaBrasil}] Enviando e-mail para ${evento.email} sobre o evento ${evento.title}`);
                    await transporter.sendMail(mailOptions);
                    console.log(`[${horaBrasil}] E-mail enviado com sucesso para ${evento.email}`);
                    await evento.save();
                } catch (error) {
                    console.error(`[${horaBrasil}] Erro ao enviar e-mail para ${evento.email}:`, error);
                }
            }
        }
    } catch (error) {
        console.error(`[${getHoraBrasil()}] Erro ao verificar lembretes:`, error);
    }
}

module.exports = { verificarLembretes };
