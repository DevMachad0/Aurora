const mongoose = require("mongoose");

// Função para obter o histórico de conversas de um usuário
const getChatHistory = async (email, empresa, date) => {
  try {
    const collectionName = `data_${empresa}`;
    const query = { email };
    if (date) {
      query.date = date;
    }
    const chatHistory = await mongoose.connection.collection(collectionName).find(query).toArray();

    if (!chatHistory.length) {
      return [];
    }

    return chatHistory.flatMap(history => history.chat.map(chat => ({
      sender: chat.sender,
      message: chat.message,
      timestamp: chat.timestamp,
      date: history.date // Inclui a data da conversa
    })));
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
      console.log(`Inserindo novo histórico de chat para ${email} na coleção ${collectionName}`);
      await mongoose.connection.collection(collectionName).insertOne({
        email,
        date: today,
        chat: [chatData],
      });
    } else {
      console.log(`Atualizando histórico de chat para ${email} na coleção ${collectionName}`);
      await mongoose.connection.collection(collectionName).updateOne(
        { email, date: today },
        { $push: { chat: chatData } }
      );
    }
  } catch (error) {
    console.error("Erro ao salvar histórico de chat:", error);
    throw new Error(error.message);
  }
};

// Nova função para obter o histórico de conversas de um usuário através do database
const getChatHistoryByDatabase = async (email, database) => {
  try {
    // Sanitização do nome do banco de dados (substituindo espaços por underscores)
    const sanitizedDatabase = database.replace(/\s+/g, '_');
    console.log(`Conectando à database: ${sanitizedDatabase}`);
    
    // Conecta ao banco de dados correto
    const db = mongoose.connection.useDb(sanitizedDatabase);

    // Define o modelo para o histórico de chat
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
    }, { collection: "chat_history" }); // Defina a coleção correta aqui

    // Cria o modelo para o histórico de chat
    const ChatHistory = db.model("ChatHistory", chatHistorySchema);

    console.log(`Buscando histórico de chat para o email: ${email}`);
    
    // Busca o histórico de chat do usuário
    const chatHistory = await ChatHistory.findOne({ email }).sort({ date: -1 }); // Ordena por data (mais recente primeiro)

    if (!chatHistory) {
      console.log("Nenhum histórico de chat encontrado.");
      return [];
    }

    console.log("Histórico de chat encontrado:", chatHistory);
    return chatHistory.chat; // Retorna apenas as mensagens do chat
  } catch (error) {
    console.error("Erro ao obter histórico de chat:", error);
    throw new Error(error.message);
  }
};

module.exports = { getChatHistory, saveChatHistory, getChatHistoryByDatabase };
