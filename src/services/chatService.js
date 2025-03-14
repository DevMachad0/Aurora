const mongoose = require("mongoose");

// Função para obter o histórico de conversas de um usuário
const getChatHistory = async (email, database, date, keyword) => {
  try {
    const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(sanitizedDatabase);
    const collectionName = "historico";

    // Verifica se a coleção existe, se não, cria
    const collections = await db.db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName);
    }

    const query = { email };
    if (date) {
      query.date = date;
    }
    const chatHistory = await db.collection(collectionName).find(query).toArray();

    if (!chatHistory.length) {
      return [];
    }

    let history = chatHistory.flatMap(history => history.chat ? history.chat.map(chat => ({
      sender: chat.sender,
      message: chat.message,
      timestamp: chat.timestamp,
      date: history.date // Inclui a data da conversa
    })) : []);

    if (keyword) {
      history = history.filter(chat => chat.message.includes(keyword)); // Filtra por palavra-chave
    }

    return history;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Função para salvar o histórico de conversas de um usuário
const saveChatHistory = async (email, database, chatData) => {
  try {
    const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(sanitizedDatabase);
    const collectionName = "historico";

    // Verifica se a coleção existe, se não, cria
    const collections = await db.db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName);
    }

    const today = new Date().toISOString().split("T")[0];
    const chatHistory = await db.collection(collectionName).findOne({ email, date: today });

    if (!chatHistory) {
      await db.collection(collectionName).insertOne({
        email,
        date: today,
        chat: [chatData],
      });
    } else {
      await db.collection(collectionName).updateOne(
        { email, date: today },
        { $push: { chat: chatData } }
      );
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Nova função para obter o histórico de conversas de um usuário através do database
const getChatHistoryByDatabase = async (email, database) => {
  try {
    const sanitizedDatabase = `data_${database.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    console.log(`Conectando à database: ${sanitizedDatabase}`);
    
    const db = mongoose.connection.useDb(sanitizedDatabase);
    const collectionName = "historico";

    // Verifica se a coleção existe, se não, cria
    const collections = await db.db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName);
    }

    const chatHistorySchema = new mongoose.Schema({
      email: String,
      date: String, // Data formatada (YYYY-MM-DD)
      chat: [
        {
          sender: String,
          message: String,
          timestamp: Date
        }
      ]
    }, { collection: collectionName });

    const ChatHistory = db.model("ChatHistory", chatHistorySchema);

    console.log(`Buscando histórico de chat para o email: ${email}`);
    
    const chatHistory = await ChatHistory.findOne({ email }).sort({ date: -1 });

    if (!chatHistory) {
      console.log("Nenhum histórico de chat encontrado.");
      return [];
    }

    console.log("Histórico de chat encontrado:", chatHistory);
    return chatHistory.chat;
  } catch (error) {
    console.error("Erro ao obter histórico de chat:", error);
    throw new Error(error.message);
  }
};

// Função para obter dados da empresa com base no tipo e nome da empresa
const getEmpresaData = async (empresa, tipo) => {
  try {
    const sanitizedDatabase = `data_${empresa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(sanitizedDatabase);
    const collectionName = "documentos";
    const empresaData = await db.collection(collectionName).findOne({ tipo });

    if (!empresaData) {
      throw new Error("Dados da empresa não encontrados.");
    }

    return empresaData;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { getChatHistory, saveChatHistory, getChatHistoryByDatabase, getEmpresaData };
