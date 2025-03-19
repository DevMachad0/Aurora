const mongoose = require("mongoose");

const lembreteEventoSchema = new mongoose.Schema({
    title: String,
    date: String,
    startTime: String,
    endTime: String,
    description: String,
    email: String,
    notifyEmail: Boolean,
    status: { type: String, default: "evento criado" }, // Adicionado campo status
}, { timestamps: true });

module.exports = mongoose.model("LembreteEvento", lembreteEventoSchema);
