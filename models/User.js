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
        // O default garante que novos usuários tenham todos os arrays prontos
        default: {
            tarefas: [],           // Simplificado: removido o objeto "agenda"
            treinos: [],
            materias: [],
            historicoEstudos: [],
            financas: [],
            saude: {}              // Objeto vazio para chaves de data (ex: "2024-05-20")
        } 
    }
}, { 
    // minimize: false impede que o Mongoose apague campos vazios do banco
    minimize: false, 
    timestamps: true 
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;