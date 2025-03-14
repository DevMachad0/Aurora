const mongoose = require("mongoose");
const { planStorageLimits } = require("../services/userService");

const getStorageStatus = async (database, plano) => {
  try {
    const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(sanitizedDatabase);

    // Verifica se o plano é válido
    if (!planStorageLimits[plano]) {
      throw new Error("Plano de armazenamento inválido");
    }

    // Obtém o status de armazenamento do banco de dados
    const stats = await db.db.command({ dbStats: 1 });

    const totalGB = planStorageLimits[plano] / (1024 * 1024 * 1024);
    const emUsoBytes = stats.dataSize;
    const restanteBytes = planStorageLimits[plano] - emUsoBytes;

    const storageStatus = {
      total: totalGB.toFixed(2),
      emUso: emUsoBytes,
      restante: restanteBytes,
    };

    return storageStatus;
  } catch (error) {
    console.error("Erro ao obter status de armazenamento:", error);
    throw new Error(error.message);
  }
};

module.exports = { getStorageStatus };
