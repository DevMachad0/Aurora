const User = require("../models/userModel");

// Criar usuário
const createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Buscar usuário por e-mail
const getUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Buscar usuário por ID
const getUserById = async (id) => {
  try {
    return await User.findById(id);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { createUser, getUserByEmail, getUserById };
