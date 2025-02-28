const mongoose = require('mongoose');
const User = require('./src/models/userModel');  // Importando o modelo do usuário
const { createUser } = require('./src/services/userService'); // Importando a função de criação do usuário
require('dotenv').config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

async function run() {
  try {
    const userData = {
      nome: 'Deivid Kevin da Silva Machado',
      email: 'deivid@empresa.com',
      empresa: 'Empresa X',
      usuario: 'deivid',
      senha: '1234',
      licenca: 'premium',
      plano: 'MK3',
      dados: ['dados do cliente', 'informações extras'],
      telefone: '123456789',
      status: 'online',
      tipo: 'setor',
      statusLicenca: 'Ativo',
    };

    // Utiliza a função createUser do userService para criar o usuário e sua coleção
    const user = await createUser(userData);
    console.log('User created and saved:', user);
  } catch (err) {
    console.error('Error saving user:', err);
  } finally {
    mongoose.connection.close();
  }
}

run().catch(console.dir);
