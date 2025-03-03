require("dotenv").config(); // Importa variáveis do .env
const cors = require('cors');
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require("./src/routes/userRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const chatHistoryRoutes = require("./src/routes/chatHistoryRoutes");
const storageRoutes = require("./src/routes/storageRoutes");
const chatSupportRoutes = require('./src/routes/chat_support'); 
const AuthenticatedDomain = require('./src/models/authenticatedDomainsModel');

const app = express();
app.use(express.json());

async function getAuthenticatedDomains() {
    try {
        const domains = await AuthenticatedDomain.find().distinct('dominios');
        return domains;
    } catch (error) {
        console.error('Erro ao buscar domínios autenticados:', error);
        return [];
    }
}

app.use(async (req, res, next) => {
    const allowedOrigins = await getAuthenticatedDomains();
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'], // Métodos permitidos
        allowedHeaders: ['Content-Type'], // Cabeçalhos permitidos
        credentials: true // Permite envio de cookies
    })(req, res, next);
});

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
