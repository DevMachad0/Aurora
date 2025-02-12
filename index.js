require("dotenv").config(); // Importa variáveis do .env

const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require("./src/routes/userRoutes");

const app = express();
app.use(express.json());

// Servindo arquivos estáticos da pasta 'public'
app.use(express.static("public"));

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("Erro: MONGO_URI não está definido no arquivo .env");
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB conectado!"))
.catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// Rota raiz que serve o index.html da pasta public
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html"); // Envia o arquivo index.html
});

app.use("/users", userRoutes);
app.use('/api', authRoutes); // Definir rota para login

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log("Acesse o sistema em: http://localhost:3000/");
});
