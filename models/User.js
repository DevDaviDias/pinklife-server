const mongoose = require("mongoose");

// --- Exemplo de estrutura de um registro de saúde por dia ---
// saude: {
//   "2025-02-21": {
//     data: "2025-02-21",
//     menstruando: true,
//     intensidadeFluxo: "moderado",   // "leve" | "moderado" | "intenso" | null
//     notas: "...",
//     sintomas: {
//       dorDeCabeca: true,
//       intensidadeDorDeCabeca: "forte",  // "leve" | "moderada" | "forte" | "insuportável" | null
//       colica: true,
//       intensidadeColica: "moderada",    // "leve" | "moderada" | "forte" | "insuportável" | null
//       inchaco: false,
//       seiosSensiveis: false,
//       humorInstavel: true,
//       tipoHumor: "irritada",  // "feliz" | "ansiosa" | "irritada" | "triste" | "sensível" | "normal" | null
//     }
//   }
// }

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Foto de perfil (URL do Cloudinary)
    fotoPerfil: {
      type: String,
      default: null,
    },

    progress: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        tarefas: [],
        habitos: [],
        treinos: [],
        materias: [],
        historicoEstudos: [],
        financas: [],
        diario: [],

        // Saúde: objeto com chave = "yyyy-MM-dd"
        // Cada dia tem: menstruando, intensidadeFluxo, sintomas (com intensidades e humor), notas
        saude: {},

        beleza: {
          skincareManha: {
            limpador: false,
            tonico: false,
            hidratante: false,
            protetor: false,
          },
          skincareNoite: {
            demaquilante: false,
            limpador: false,
            serum: false,
            hidratante: false,
          },
          cronogramaCapilar: "Hidratação",
        },
        alimentacao: {
          refeicoes: { cafe: "", almoco: "", lanche: "", jantar: "" },
          compras: [],
        },
        viagens: {
          mala: [],
        },
        casa: {
          tarefas: [],
          cardapio: { almoco: "", jantar: "" },
        },
      },
    },
  },
  {
    minimize: false, // Mantém objetos vazios como "saude: {}" no banco
    timestamps: true, // Cria createdAt e updatedAt automaticamente
  }
);

// Força o Mongoose a reconhecer mudanças em campos Mixed
UserSchema.pre("save", function (next) {
  this.markModified("progress");
  next();
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;