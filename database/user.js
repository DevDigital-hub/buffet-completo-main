const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  telefone: { type: String },
  cargo: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  dataCadastro: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userModel);

module.exports = User;