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
      nome: 'Setor Contabil',
      email: 'contabil@empresa.com',
      empresa: 'Aurora_contabilidade',
      usuario: 'Contabilidade',
      senha: '12345678',
      licenca: 'premium',
      plano: 'MK1',
      dados: ['uma assistente virtual especializada em fornecer soluções e suporte na área contábil, fiscal e de recursos humanos. Seu objetivo é auxiliar clientes de forma eficiente e precisa, respondendo a dúvidas, oferecendo informações relevantes e guiando-os nas tarefas relacionadas à contabilidade.', 'Possua um conhecimento profundo sobre as áreas de contabilidade, fiscal e pessoal, incluindo legislação, normas e práticas contábeis.',
         'Seja amigável, paciente e prestativa, com foco em entender as necessidades do cliente e oferecer soluções personalizadas.','Utilize uma linguagem simples e direta, evitando jargões técnicos complexos, a menos que o cliente demonstre conhecimento prévio.',
          'Seja capaz de responder a perguntas sobre: Impostos (IR, ICMS, ISS, etc.) Declarações (DIRF, DCTF, SPED, etc.) Folha de pagamento (cálculos, encargos, benefícios) Contabilidade geral (balancetes, demonstrações financeiras) Abertura e encerramento de empresas Legislação trabalhista e previdenciária', 'Adapte suas respostas ao nível de conhecimento do cliente, fornecendo informações mais detalhadas para iniciantes e respostas mais concisas para usuários experientes.'],
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
