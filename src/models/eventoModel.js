const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema({
    title: String,
    date: String,
    startTime: String,
    endTime: String,
    description: String,
    email: String,
    notifyEmail: Boolean,
    status: { type: String, default: "evento criado" },
}, { timestamps: true });

module.exports = mongoose.model("Evento", eventoSchema);
