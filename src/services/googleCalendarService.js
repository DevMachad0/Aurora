const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const User = require("../models/userModel");
require("dotenv").config();

const oAuth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://aurora-7j74.onrender.com/api/auth/google/callback"
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

async function isAuthenticated(email) {
    const user = await User.findOne({ email });
    if (!user) {
        return false;
    }
    return !!user.access_token && user.expiry_date > Date.now();
}

async function createGoogleEvent(email, eventDetails) {
    try {
        if (!eventDetails || !eventDetails.summary || !eventDetails.start || !eventDetails.end) {
            throw new Error("Detalhes do evento incompletos.");
        }

        const tokens = await getTokensForUser(email);
        oAuth2Client.setCredentials(tokens);

        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const event = await calendar.events.insert({
            calendarId: "primary",
            resource: eventDetails,
        });

        return `Evento criado com sucesso: ${event.data.htmlLink}`;
    } catch (error) {
        console.error("Erro ao criar evento no Google Calendar:", error);
        if (error.errors && error.errors.length > 0) {
            throw new Error(`Erro ao criar evento: ${error.errors[0].message}`);
        }
        throw new Error("Erro ao criar evento no Google Calendar.");
    }
}

async function getGoogleEvents(email) {
    try {
        const tokens = await getTokensForUser(email);
        oAuth2Client.setCredentials(tokens);

        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const events = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        return events.data.items.map(event => `${event.summary} (${event.start.dateTime || event.start.date})`);
    } catch (error) {
        console.error("Erro ao obter eventos do Google Calendar:", error);
        throw new Error("Erro ao obter eventos do Google Calendar");
    }
}

async function updateGoogleEvent(email, eventDetails) {
    try {
        const tokens = await getTokensForUser(email);
        oAuth2Client.setCredentials(tokens);

        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const event = await calendar.events.update({
            calendarId: "primary",
            eventId: eventDetails.id,
            resource: eventDetails,
        });

        return `Evento atualizado com sucesso: ${event.data.htmlLink}`;
    } catch (error) {
        console.error("Erro ao atualizar evento no Google Calendar:", error);
        throw new Error("Erro ao atualizar evento no Google Calendar");
    }
}

async function getTokensForUser(email) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Usuário não encontrado.");
    }

    if (user.expiry_date < Date.now()) {
        try {
            const newTokens = await oAuth2Client.refreshToken(user.refresh_token);
            user.access_token = newTokens.credentials.access_token;
            user.expiry_date = newTokens.credentials.expiry_date;
            await user.save();
        } catch (refreshError) {
            console.error("Erro ao atualizar token:", refreshError);
            throw new Error("Erro ao atualizar token");
        }
    }

    return {
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        scope: SCOPES.join(" "),
        token_type: "Bearer",
        expiry_date: user.expiry_date,
    };
}

module.exports = { createGoogleEvent, getGoogleEvents, updateGoogleEvent, isAuthenticated };