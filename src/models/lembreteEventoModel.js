const mongoose = require("mongoose");

const lembreteEventoSchema = new mongoose.Schema({
    title: String,
    date: String,
    startTime: String,
    endTime: String,
    description: String,
    email: String,
    notifyEmail: Boolean,
}, { timestamps: true });

module.exports = mongoose.model("LembreteEvento", lembreteEventoSchema);
