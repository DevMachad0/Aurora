require("dotenv").config(); // Importa variáveis do .env
const cors = require('cors');
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require("./src/routes/userRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const chatHistoryRoutes = require("./src/routes/chatHistoryRoutes");
const storageRoutes = require("./src/routes/storageRoutes");
const chatSupportRoutes = require('./src/routes/chat_support'); 
const domainRoutes = require("./src/routes/domainRoutes");
const fs = require('fs');
require("./src/config/passportConfig"); // Adiciona esta linha para configurar o Passport

// Carregar domínios permitidos de um arquivo JSON
const allowedDomains = JSON.parse(fs.readFileSync('./allowedDomains.json', 'utf8'));

const app = express();
app.use(express.json());
// Configuração do CORS (deve ser feita antes de definir as rotas)
app.use(cors({
    origin: function (origin, callback) {
        if (allowedDomains.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'], // Métodos permitidos
    allowedHeaders: ['Content-Type'] // Cabeçalhos permitidos
}));

// Configuração do Passport.js
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

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
app.use("/api", domainRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log("Acesse o sistema em: https://aurora-7j74.onrender.com/");
});
