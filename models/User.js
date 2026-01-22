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
        // Adicionamos 'habitos' aqui para garantir a estrutura completa
        default: {
            tarefas: [],           
            habitos: [],           // <--- ADICIONADO AQUI
            treinos: [],
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