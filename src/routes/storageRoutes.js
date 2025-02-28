const express = require("express");
const { getStorageStatus } = require("../config/storageConfig");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/storage-status", verifyToken, async (req, res) => {
  try {
    const database = req.headers["user-database"];
    if (!database) {
      return res.status(400).json({ error: "Database do usuário não encontrado" });
    }

    const storageStatus = await getStorageStatus(database);
    res.json(storageStatus);
  } catch (error) {
    console.error("Erro ao obter status de armazenamento:", error);
    res.status(500).json({ error: "Erro ao obter status de armazenamento" });
  }
});

module.exports = router;
