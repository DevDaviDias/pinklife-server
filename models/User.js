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
        lowercase: true // Transforma o email em minúsculo automaticamente
    },
    password: { 
        type: String, 
        required: true 
    },
    progress: { 
        type: Object, 
        // Definimos a estrutura padrão para que novos usuários 
        // não comecem com campos undefined
        default: {
            agenda: { tarefas: [] },
            treinos: [],
            estudos: { materias: [], historico: [] }
        } 
    }
}, { 
    // minimize: false impede que o MongoDB delete chaves vazias como "tarefas: []"
    minimize: false, 
    // timestamps: cria automaticamente os campos createdAt e updatedAt
    timestamps: true 
});

// Verifica se o modelo já existe antes de criá-lo (evita erros de compilação)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;