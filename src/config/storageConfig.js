const mongoose = require("mongoose");

const planStorageLimits = {
    MK1: 2147483648, // 2 GB
    MK2: 5368709120, // 5 GB
    MK3: 10737418240, // 10 GB
};

const getStorageStatus = async (database, plano) => {
  try {
    const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(sanitizedDatabase);

    // Verifica se o plano é válido
    if (!planStorageLimits.hasOwnProperty(plano)) {
      throw new Error("Plano de armazenamento inválido");
    }

    // Obtém o status de armazenamento do banco de dados
    const stats = await db.db.command({ dbStats: 1 });

    const totalGB = (planStorageLimits[plano] / (1024 * 1024 * 1024)).toFixed(2);
    const emUsoBytes = stats.dataSize;
    const restanteBytes = planStorageLimits[plano] - emUsoBytes;

    const storageStatus = {
      total: parseFloat(totalGB),
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
