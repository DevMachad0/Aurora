const axios = require("axios");

const GOOGLE_SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1";

async function searchWeb(query) {
    try {
        const response = await axios.get(GOOGLE_SEARCH_API_URL, {
            params: {
                key: process.env.GOOGLE_SEARCH_API_KEY,
                cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
                q: query,
            },
        });

        // Retorna os resultados da pesquisa
        return response.data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        }));
    } catch (error) {
        console.error("Erro ao realizar pesquisa na web:", error);
        throw new Error("Não foi possível realizar a pesquisa na web.");
    }
}

module.exports = { searchWeb };
