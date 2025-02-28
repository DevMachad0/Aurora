const mongoose = require("mongoose");

const getStorageStatus = async (database) => {
  try {
    // Conecta ao banco de dados principal
    const db = mongoose.connection.useDb("aurora_db");

    // Obtém o status de armazenamento da coleção específica
    const stats = await db.db.command({ collStats: database });

    const totalGB = (stats.maxSize / (1024 * 1024 * 1024)).toFixed(2);
    const emUsoBytes = stats.totalIndexSize;
    const atualBytes = stats.maxSize - stats.storageSize;

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
