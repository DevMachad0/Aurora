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
            status: "evento criado",
            date: { $lte: agora.toISOString().split("T")[0] },
            startTime: { $lte: agora.toTimeString().split(" ")[0] },
        });

        for (const evento of eventos) {
            const mailOptions = {
                from: "lembrete.agendamento.aurora@gmail.com",
                to: evento.email,
                subject: `Lembrete de Evento: ${evento.title} - ${evento.date} ${evento.startTime}`,
                text: `
                    Olá,

                    Este é um lembrete para o evento que você criou:

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
                console.log(`E-mail enviado para ${evento.email} sobre o evento ${evento.title}`);

                // Atualizar o status do evento para "evento lembrado"
                evento.status = "evento lembrado";
                await evento.save();
            } catch (error) {
                console.error(`Erro ao enviar e-mail para ${evento.email}:`, error);
            }
        }
    } catch (error) {
        console.error("Erro ao verificar lembretes:", error);
    }
}

module.exports = { verificarLembretes };
