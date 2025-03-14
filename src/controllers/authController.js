const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const mongoose = require("mongoose");

const login = async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).json({ error: "Senha incorreta" });
    }

    // Verifica se o banco de dados da empresa existe, se não, cria
    const dbName = `data_${user.empresa.replace(/\s+/g, '_')}`;
    const db = mongoose.connection.useDb(dbName);

    try {
      await db.command({ ping: 1 });
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') {
        await db.createCollection("exampleCollection");
      } else {
        throw error;
      }
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login bem-sucedido",
      token,
      user: {
        nome: user.nome,
        usuario: user.usuario,
        email: user.email,
        telefone: user.telefone,
        empresa: user.empresa,
        licenca: user.licenca,
        tipo: user.tipo,
        status: user.status,
        plano: user.plano,
        dados: user.dados,
        database: user.database,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = { login };
