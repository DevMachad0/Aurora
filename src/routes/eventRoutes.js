const express = require("express");
const router = express.Router();
const Evento = require("../models/eventoModel");
const LembreteEvento = require("../models/lembreteEventoModel");
const mongoose = require("mongoose");

router.post("/events", async (req, res) => {
    const { title, date, startTime, endTime, description, email, notifyEmail, database } = req.body;

    if (!database) {
        return res.status(400).json({ error: "Banco de dados da empresa não especificado." });
    }

    try {
        // Sanitizar o nome do banco de dados
        const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;

        // Salvar no banco da empresa
        const empresaDb = mongoose.connection.useDb(sanitizedDatabase);
        const EventoModel = empresaDb.model("Evento", Evento.schema);
        await EventoModel.create({ title, date, startTime, endTime, description, email, notifyEmail });

        // Salvar no banco aurora_db
        const auroraDb = mongoose.connection.useDb("aurora_db");
        const LembreteEventoModel = auroraDb.model("LembreteEvento", LembreteEvento.schema);
        await LembreteEventoModel.create({ title, date, startTime, endTime, description, email, notifyEmail });

        res.status(201).json({ message: "Evento registrado com sucesso!" });
    } catch (error) {
        console.error("Erro ao registrar evento:", error);
        res.status(500).json({ error: "Erro ao registrar evento." });
    }
});

module.exports = router;
