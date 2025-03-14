const mongoose = require("mongoose");

const getStorageStatus = async (database) => {
  try {
    const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(sanitizedDatabase);

    // Obtém o status de armazenamento do banco de dados
    const stats = await db.db.command({ dbStats: 1 });

    const totalGB = (stats.storageSize / (1024 * 1024 * 1024)).toFixed(2);
    const emUsoBytes = stats.dataSize;
    const atualBytes = stats.storageSize - stats.dataSize;

    const storageStatus = {
      total: totalGB,
      emUso: emUsoBytes,
      atual: atualBytes,
    };

    return storageStatus;
  } catch (error) {
    console.error("Erro ao obter status de armazenamento:", error);
    throw new Error(error.message);
  }
};

module.exports = { getStorageStatus };
