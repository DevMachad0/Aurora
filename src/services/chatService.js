const mongoose = require("mongoose");

// Função para obter o histórico de conversas de um usuário
const getChatHistory = async (email, empresa) => {
  try {
    const collectionName = `data_${empresa}`;
    const today = new Date().toISOString().split("T")[0];
    const chatHistory = await mongoose.connection.collection(collectionName).findOne({ email, date: today });

    if (!chatHistory) {
      return [];
    }

    return chatHistory.chat.map(chat => ({
      sender: chat.sender,
      message: chat.message,
      timestamp: chat.timestamp
    }));
  } catch (error) {
    throw new Error(error.message);
  }
};

// Função para salvar o histórico de conversas de um usuário
const saveChatHistory = async (email, empresa, chatData) => {
  try {
    const collectionName = `data_${empresa}`;
    const today = new Date().toISOString().split("T")[0];
    const chatHistory = await mongoose.connection.collection(collectionName).findOne({ email, date: today });

    if (!chatHistory) {
      await mongoose.connection.collection(collectionName).insertOne({
        email,
        date: today,
        chat: [chatData],
      });
    } else {
      await mongoose.connection.collection(collectionName).updateOne(
        { email, date: today },
        { $push: { chat: chatData } }
      );
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { getChatHistory, saveChatHistory };
