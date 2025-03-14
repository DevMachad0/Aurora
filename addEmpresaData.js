const mongoose = require('mongoose');
const Empresa = require('./src/models/empresaModel');
require('dotenv').config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

async function run() {
  try {
    const empresaData = {
        tipo: "documento",
        empresa: "Empresa X",
        nome: "Termos e Condições de Uso",
        conteudo: [
          "Bem-vindo à Empresa X! Ao acessar e utilizar nossos serviços, você concorda com os seguintes termos e condições.",
          "1. Aceitação dos Termos: Ao utilizar nossos serviços, você concorda em cumprir os termos e condições aqui descritos.",
          "2. Uso dos Serviços: Você concorda em usar os serviços de forma responsável e dentro dos limites da lei.",
          "3. Responsabilidade: A Empresa X não se responsabiliza por danos diretos ou indiretos que possam surgir do uso inadequado dos serviços.",
          "4. Alterações: A Empresa X se reserva o direito de alterar os termos e condições a qualquer momento. Qualquer alteração será comunicada aos usuários.",
          "5. Privacidade: Respeitamos sua privacidade e protegemos seus dados pessoais conforme nossa Política de Privacidade.",
          "6. Encerramento de Conta: A Empresa X pode suspender ou encerrar sua conta caso haja violação desses termos.",
          "7. Lei Aplicável: Este acordo será regido pelas leis do país em que a Empresa X está registrada."
        ]
      };

    // Conecta ao banco de dados da empresa
    const dbName = `data_${empresaData.empresa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const db = mongoose.connection.useDb(dbName);
    const collectionName = "documentos";

    // Cria um novo documento na coleção de documentos da empresa
    await db.collection(collectionName).insertOne(empresaData);

    console.log('Dados da empresa adicionados com sucesso');
  } catch (err) {
    console.error('Erro ao adicionar dados da empresa:', err);
  } finally {
    mongoose.connection.close();
  }
}

run().catch(console.dir);
