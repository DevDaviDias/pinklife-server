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
            estudos: { materias: [], historico: [] }, // Limpei o "treinos" daqui para não duplicar
            financas: [] // <--- ADICIONADO PARA O MÓDULO DE FINANÇAS
        } 
    }
}, { 
    minimize: false, 
    timestamps: true 
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;