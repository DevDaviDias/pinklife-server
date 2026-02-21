const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /auth/register
router.post("/register", async (req, res) => {
  let { name, email, password, confirmPassword } = req.body || {};

  if (password !== confirmPassword)
    return res.status(422).json({ msg: "Senhas não conferem" });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: passwordHash,
    progress: {
      tarefas: [],
      habitos: [],
      materias: [],
      historicoEstudos: [],
      treinos: [],
      financas: [],
      saude: {},
      diario: [],
      beleza: {
        skincareManha: { limpador: false, tonico: false, hidratante: false, protetor: false },
        skincareNoite: { demaquilante: false, limpador: false, serum: false, hidratante: false },
        cronogramaCapilar: "Hidratação",
      },
      alimentacao: {
        refeicoes: { cafe: "", almoco: "", lanche: "", jantar: "" },
        compras: [],
      },
      viagens: { mala: [] },
      casa: { tarefas: [], cardapio: { almoco: "", jantar: "" } },
    },
  });

  try {
    await user.save();
    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch {
    res.status(500).json({ msg: "Erro ao criar usuário" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};

    const user = await User.findOne({ email });
    if (!user) return res.status(422).json({ msg: "Usuário não encontrado!" });

    // Conta criada via Google não tem senha
    if (!user.password)
      return res.status(422).json({
        msg: "Essa conta foi criada com o Google. Use o botão 'Entrar com Google'.",
      });

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) return res.status(404).json({ msg: "Senha inválida" });

    const token = jwt.sign({ id: user._id }, process.env.SECRET);
    res.status(200).json({ token });
  } catch {
    res.status(500).json({ msg: "Erro ao fazer login" });
  }
});

// POST /auth/google
// O app mobile manda: googleId, name, email, foto
// Backend cria o usuário se não existir, ou autentica se já existir
router.post("/google", async (req, res) => {
  try {
    const { googleId, name, email, foto } = req.body;

    if (!googleId || !email)
      return res.status(400).json({ msg: "Dados do Google incompletos." });

    let user = await User.findOne({ email });

    if (user) {
      // Já existe — vincula googleId se ainda não tiver
      if (!user.googleId) {
        user.googleId = googleId;
        if (foto && !user.fotoPerfil) user.fotoPerfil = foto;
        await user.save();
      }
    } else {
      // Cria novo usuário via Google (sem senha)
      user = new User({
        name,
        email,
        googleId,
        fotoPerfil: foto || null,
        password: null,
        progress: {
          tarefas: [],
          habitos: [],
          materias: [],
          historicoEstudos: [],
          treinos: [],
          financas: [],
          saude: {},
          diario: [],
          beleza: {
            skincareManha: { limpador: false, tonico: false, hidratante: false, protetor: false },
            skincareNoite: { demaquilante: false, limpador: false, serum: false, hidratante: false },
            cronogramaCapilar: "Hidratação",
          },
          alimentacao: {
            refeicoes: { cafe: "", almoco: "", lanche: "", jantar: "" },
            compras: [],
          },
          viagens: { mala: [] },
          casa: { tarefas: [], cardapio: { almoco: "", jantar: "" } },
        },
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET);
    res.status(200).json({ token });
  } catch (err) {
    console.error("Erro no login Google:", err);
    res.status(500).json({ msg: "Erro ao autenticar com Google." });
  }
});

module.exports = router;