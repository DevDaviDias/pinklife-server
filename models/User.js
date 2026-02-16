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

  // Progresso geral do usuário
  progress: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {
      tarefas: [],           
      habitos: [],           
      treinos: [],
      materias: [],
      historicoEstudos: [],
      financas: [],

      // ✅ Diário adicionado
      diario: [],

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
  minimize: false,   // mantém objetos vazios no Mongo
  timestamps: true  // createdAt / updatedAt
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;