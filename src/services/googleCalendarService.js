const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
require("dotenv").config();

const oAuth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://aurora-7j74.onrender.com/api/auth/google/callback"
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function isAuthenticated(email) {
    // Implementar lógica para verificar se o usuário está autenticado
    // Exemplo: Verificar se o token de acesso está armazenado
    return true;
}

async function createGoogleEvent(email, eventDetails) {
    try {
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
        throw new Error("Erro ao criar evento no Google Calendar");
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
    // Implementar lógica para obter tokens de acesso do usuário
    // Exemplo: Buscar tokens armazenados no banco de dados
    // Aqui, você deve implementar a lógica para buscar os tokens de acesso do usuário no banco de dados
    // Para fins de exemplo, estou retornando tokens fictícios
    return {
        access_token: "VALID_ACCESS_TOKEN",
        refresh_token: "VALID_REFRESH_TOKEN",
        scope: SCOPES.join(" "),
        token_type: "Bearer",
        expiry_date: Date.now() + 3600 * 1000,
    };
}

module.exports = { createGoogleEvent, getGoogleEvents, updateGoogleEvent, isAuthenticated };
