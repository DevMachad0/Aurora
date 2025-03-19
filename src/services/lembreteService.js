const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const LembreteEvento = require("../models/lembreteEventoModel");
require("dotenv").config();

const sendDailyReminders = async () => {
    try {
        const today = new Date().toISOString().split("T")[0]; // Data atual no formato YYYY-MM-DD

        // Busca lembretes do dia com status "evento criado" e notifyEmail true
        const lembretes = await LembreteEvento.find({
            date: today,
            status: "evento criado",
            notifyEmail: true,
        });

        if (lembretes.length === 0) {
            console.log("Nenhum lembrete para enviar hoje.");
            return;
        }

        // Configuração do transporte do nodemailer
        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true, // SSL/TLS
            auth: {
                user: "lembrete@aurorati.tech",
                pass: process.env.EMAIL_PASSWORD, // Senha do e-mail no .env
            },
        });

        // Envia e-mails para cada lembrete
        for (const lembrete of lembretes) {
            const mailOptions = {
                from: '"Aurora TI" <lembrete@aurorati.tech>',
                to: lembrete.email,
                subject: `Lembrete do Evento: ${lembrete.title}`,
                text: `Olá, este é um lembrete para o evento "${lembrete.title}" que ocorrerá em ${lembrete.date} das ${lembrete.startTime} às ${lembrete.endTime}. Descrição: ${lembrete.description}`,
            };

            await transporter.sendMail(mailOptions);
            console.log(`Lembrete enviado para: ${lembrete.email}`);

            // Atualiza o status do lembrete para "email enviado"
            lembrete.status = "email enviado";
            await lembrete.save();
        }
    } catch (error) {
        console.error("Erro ao enviar lembretes:", error);
    }
};

const scheduleDailyReminders = () => {
    setInterval(async () => {
        console.log("Verificando lembretes do dia...");
        await sendDailyReminders();
    }, 60 * 1000); // Executa a cada 1 minuto
};

module.exports = { sendDailyReminders, scheduleDailyReminders };
