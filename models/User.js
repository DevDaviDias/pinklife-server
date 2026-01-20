const mongoose = require('mongoose');

const User = mongoose.model('User', {
    name: String,
    email: String,
    password: String,
    // Adicione esta linha abaixo para permitir salvar os dados das páginas
    progress: { type: Object, default: {} }
});

module.exports = User;