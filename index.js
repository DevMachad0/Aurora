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

// Função para carregar domínios autenticados
async function getAuthenticatedDomains() {
    try {
        const domains = await AuthenticatedDomain.find().distinct('dominios');
        return domains;
    } catch (error) {
        console.error('Erro ao buscar domínios autenticados:', error);
        return [];
    }
}

// Configuração de CORS (agora com tratamento explícito para requisições OPTIONS)
async function configureCors() {
    const allowedOrigins = await getAuthenticatedDomains(); // Pega os domínios autenticados
    
    app.use((req, res, next) => {
        const origin = req.headers.origin;

        if (!origin || allowedOrigins.includes(origin)) {
            // Permite a origem se ela estiver na lista de domínios autenticados
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else {
            // Bloqueia a origem se não estiver na lista
            res.setHeader('Access-Control-Allow-Origin', ''); // Bloqueia a origem
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); // Métodos permitidos
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Cabeçalhos permitidos
        res.setHeader('Access-Control-Allow-Credentials', 'true'); // Permite cookies

        // Responde às requisições OPTIONS (preflight request)
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        next(); // Continua para o próximo middleware
    });
}

// Executa a configuração do CORS após carregar os domínios
configureCors();

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

// Definindo as rotas
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
