const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    progress: { 
        type: Object, 
        default: {
            agenda: { tarefas: [] },
            treinos: [],
            // Ajustado para bater com as rotas do seu index.js:
            materias: [],
            historicoEstudos: [],
            financas: [],
            saude: {} 
        } 
    }
}, { 
    minimize: false, 
    timestamps: true 
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;