const AuroraCore = require("../models/auroraCoreModel");

// Função para obter as instruções e restrições do AuroraCore
const getAuroraCoreData = async () => {
    try {
        const instructions = await AuroraCore.findOne({ type: "instructions" });
        const restrictions = await AuroraCore.findOne({ type: "restrictions" });

        return {
            instructions: instructions ? instructions.content : [],
            restrictions: restrictions ? restrictions.content : []
        };
    } catch (error) {
        console.error("Erro ao obter dados do AuroraCore:", error);
        throw new Error(error.message);
    }
};

module.exports = { getAuroraCoreData };
