const mongoose = require('mongoose');
const AuthenticatedDomain = require('./src/models/authenticatedDomainsModel');
require('dotenv').config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

async function run() {
  try {
    const domainData = {
      empresa: 'Empresa X',
      statusLicenca: 'Ativo',
      qtdPerfis: 2,
      dominios: ['https://aurorati.tech/', 'https://sub.empresa-x.com']
    };

    const authenticatedDomain = new AuthenticatedDomain(domainData);
    await authenticatedDomain.save();
    console.log('Authenticated domain added:', authenticatedDomain);
  } catch (err) {
    console.error('Error adding authenticated domain:', err);
  } finally {
    mongoose.connection.close();
  }
}

run().catch(console.dir);
