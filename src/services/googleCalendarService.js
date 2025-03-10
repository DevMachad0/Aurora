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

async function getTokensForUser(email) {
    // Implementar lógica para obter tokens de acesso do usuário
    // Exemplo: Buscar tokens armazenados no banco de dados
    return {
        access_token: "ACCESS_TOKEN",
        refresh_token: "REFRESH_TOKEN",
        scope: SCOPES.join(" "),
        token_type: "Bearer",
        expiry_date: Date.now() + 3600 * 1000,
    };
}

module.exports = { createGoogleEvent, isAuthenticated };
