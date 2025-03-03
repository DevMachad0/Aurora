require("dotenv").config(); // Importa variáveis do .env

const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require("./src/routes/userRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const chatHistoryRoutes = require("./src/routes/chatHistoryRoutes");
const storageRoutes = require("./src/routes/storageRoutes");
const chatSupportRoutes = require('./src/routes/chat_support'); 

const app = express();
app.use(express.json());

// Servindo arquivos estáticos da pasta 'public'
app.use(express.static("public"));
app.use('/styles', express.static('public/styles'));

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("Erro: MONGO_URI não está definido no arquivo .env");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB conectado!"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// Rota raiz que serve o index.html da pasta public
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html"); // Envia o arquivo index.html
});

app.use("/users", userRoutes);
app.use('/api', authRoutes); // Definir rota para login
app.use('/api', chatSupportRoutes);
app.use("/api", chatRoutes);
app.use("/api", chatHistoryRoutes);
app.use("/api", storageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log("Acesse o sistema em: https://aurora-7j74.onrender.com/");
});
