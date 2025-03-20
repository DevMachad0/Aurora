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
        user.database = `data_${user.empresa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
        await user.save();

        // Cria um novo banco de dados baseado na empresa do usuário
        const dbName = `data_${user.empresa.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
        const db = mongoose.connection.useDb(dbName);

        // Define o limite de armazenamento com base no plano do usuário
        const storageLimit = planStorageLimits[user.plano] || 2147483648; // 2 GB por padrão
        await db.createCollection("historico", { capped: true, size: storageLimit });
        await db.createCollection("documentos");

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

// Nova função para obter apenas os dados do perfil do usuário
const getUserProfileData = async (email) => {
  try {
    const user = await User.findOne({ email }, 'dados'); // Busca apenas a linha 'dados'
    return user ? user.dados : null;
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

async function getPerfilFromAuroraDB(perfil_email) {
    try {
        const auroraDb = mongoose.connection.useDb("aurora_db");
        const user = await auroraDb.collection("users").findOne({ email: perfil_email });
        return user;
    } catch (error) {
        console.error("Erro ao buscar perfil no banco aurora_db:", error.message);
        return null;
    }
}

module.exports = { createUser, getUserByEmail, getUserById, getUserProfileData, updateUserDados, updateUserTokenAdmin, getPerfilFromAuroraDB };
