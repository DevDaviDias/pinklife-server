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

      // ✅ Diário inicializado como array vazio
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
  minimize: false,   // ✅ Importante: mantém objetos vazios como "saude: {}" no banco
  timestamps: true   // Cria createdAt e updatedAt automaticamente
});

// Força o Mongoose a reconhecer mudanças em campos Mixed
UserSchema.pre('save', function(next) {
  this.markModified('progress');
  next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;