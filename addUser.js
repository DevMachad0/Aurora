const mongoose = require('mongoose');
const User = require('./src/models/userModel');
require('dotenv').config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

async function run() {
  try {
    const newUser = new User({
      nome: 'Deivid Kevin da Silva Machado',
      email: 'deivid@empresa.com',
      empresa: 'Empresa X',
      usuario: 'deivid',
      senha: '1234',
      licenca: 'premium',
      plano: 'MK3',
      dados: ['dados do cliente', 'informações extras'],
      numero: '123456789',
      status: 'online',
      tipo: 'setor',
      statusLicenca: 'Ativo',
      database: 'data_Empresa_X'
    });

    const result = await newUser.save();
    console.log('User saved:', result);
  } catch (err) {
    console.error('Error saving user:', err);
  } finally {
    mongoose.connection.close();
  }
}

run().catch(console.dir);