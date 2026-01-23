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
            tarefas: [],           
            habitos: [],           
            treinos: [],
            materias: [],
            historicoEstudos: [],
            financas: [],
            saude: {},
            beleza: {              
                skincareManha: { limpador: false, tonico: false, hidratante: false, protetor: false },
                skincareNoite: { demaquilante: false, limpador: false, serum: false, hidratante: false },
                cronogramaCapilar: "Hidratação"
            },
            alimentacao: {
                refeicoes: { cafe: "", almoco: "", lanche: "", jantar: "" },
                compras: []
            },
            viagens: {
                mala: []
            },
            // --- ÚLTIMA ADIÇÃO: CASA ---
            casa: {
                tarefas: [],
                cardapio: { 
                    almoco: "", 
                    jantar: "" 
                }
            }
        } 
    }
}, { 
    minimize: false, 
    timestamps: true 
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;