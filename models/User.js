const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    progress: { 
        type: Object, 
        default: {
            agenda: { tarefas: [] },
            treinos: [],
            estudos: { materias: [], historico: [] }
        } 
    }
}, { 
    minimize: false, // Força o MongoDB a salvar objetos vazios {}
    timestamps: true // Cria campos 'createdAt' e 'updatedAt' automaticamente
});

module.exports = mongoose.model('User', UserSchema);