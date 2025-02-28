const User = require("../models/userModel");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const planStorageLimits = {
    MK1: 2147483648, // 2 GB
    MK2: 5368709120, // 5 GB
    MK3: 10737418240, // 10 GB
};

// Criar usuário
const createUser = async (userData) => {
    try {
        const user = new User(userData);
        user.database = `data_${user.empresa}`;
        await user.save();

        // Cria uma nova coleção baseada na empresa do usuário com limite de armazenamento
        const collectionName = `data_${user.empresa}`;
        const storageLimit = planStorageLimits[user.plano] || 2147483648; // 2 GB por padrão
        await mongoose.connection.createCollection(collectionName, { capped: true, size: storageLimit });

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

const updateUserDados = async (email, dados) => {
    try {
        await User.findOneAndUpdate({ email }, { dados });
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateUserTokenAdmin = async (email, tokenAdmin) => {
    try {
        const encryptedTokenAdmin = btoa(tokenAdmin); // Criptografar o token
        await User.findOneAndUpdate({ email }, { tokenAdmin: encryptedTokenAdmin });
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { createUser, getUserByEmail, getUserById, updateUserDados, updateUserTokenAdmin };
