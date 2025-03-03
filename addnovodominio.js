const mongoose = require('mongoose');
const Domain = require('./src/models/domainModel.js'); // Supondo que você tenha um modelo de domínio
require('dotenv').config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

async function run() {
  try {
    const dominios = ['example.com', 'example.org']; // Array de domínios
    const empresa = 'Empresa X';

    const domain = new Domain({ domains: dominios, empresa: empresa });
    const savedDomain = await domain.save();
    console.log('Domínios cadastrados com sucesso:', savedDomain);
  } catch (err) {
    console.error('Erro ao cadastrar domínios:', err);
  } finally {
    mongoose.connection.close();
  }
}

run().catch(console.dir);
