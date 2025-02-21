const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login bem-sucedido",
      token,
      user: {
        nome: user.nome,
        usuario: user.usuario,
        email: user.email,
        empresa: user.empresa,
        licenca: user.licenca,
        plano: user.plano,
        dados: user.dados,
        database: user.database, // Certifique-se de incluir o database aqui
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Adicione outras informações do usuário aqui, exceto a senha
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = { login };
