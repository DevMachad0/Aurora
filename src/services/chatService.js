const ChatHistory = require("../models/chatHistoryModel");

// Função para obter o histórico de conversas de um usuário
const getChatHistory = async (email) => {
  try {
    const chatHistory = await ChatHistory.findOne({ email });
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

module.exports = { getChatHistory };
