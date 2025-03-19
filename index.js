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
const eventRoutes = require("./src/routes/eventRoutes");
const fs = require('fs');
const helmet = require('helmet');
const { verificarLembretes } = require("./src/services/lembreteService");

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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://gc.kis.v2.scr.kaspersky-labs.com"], // Adiciona a fonte específica
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "<URL>"] // Adiciona a URL específica
    }
  }
}));

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
app.use("/api", eventRoutes);

// Executar o serviço de lembretes a cada 5 minutos
setInterval(verificarLembretes, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log("Acesse o sistema em: https://aurora-7j74.onrender.com/");
});
