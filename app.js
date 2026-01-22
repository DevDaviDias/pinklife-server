if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const User = require("./models/User.js");
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function checkToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ msg: 'Acesso negado!' });

  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    req.user = decoded; 
    next();
  } catch (erro) {
    res.status(400).json({ msg: "Token inválido!" });
  }
}

// --- ROTAS DE AUTENTICAÇÃO ---

app.post("/auth/register", async (req, res) => {
  let { name, email, password, confirmpassword } = req.body || {};
  if (password !== confirmpassword) return res.status(422).json({ msg: "Senhas não conferem" });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  
  const user = new User({ 
    name, 
    email, 
    password: passwordHash, 
    progress: {
      agenda: { tarefas: [] },
      materias: [],
      historicoEstudos: [],
      treinos: []
    } 
  });

  try {
    await user.save();
    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao criar usuário" });
  }
});

app.post("/auth/login", async (req, res) => {
  let { email, password } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) return res.status(422).json({ msg: "Usuário não encontrado!" });

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) return res.status(404).json({ msg: "Senha inválida" });

  const secret = process.env.SECRET;
  const token = jwt.sign({ id: user._id }, secret);
  res.status(200).json({ token });
});

// --- ROTA DE USUÁRIO (ME) ---
app.get("/user/me", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado!" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar usuário" });
  }
});

// --- ROTA GENÉRICA DE PROGRESSO (USADA PELA AGENDA) ---
app.post("/user/progress", checkToken, async (req, res) => {
  const { module, data } = req.body; 
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

    // Atualiza o módulo (agenda, habitos, etc)
    user.progress[module] = data;

    // AVISA O MONGOOSE PARA GRAVAR O OBJETO
    user.markModified('progress'); 
    
    await user.save();
    res.status(200).json({ msg: "Progresso atualizado com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao salvar progresso" });
  }
});

// --- ROTAS ESPECÍFICAS (ESTUDOS E TREINOS) ---

// MATÉRIAS
app.get("/estudos/historico", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // IMPORTANTE: Use exatamente o nome que está no banco (historicoEstudos)
    res.json(user.progress.historicoEstudos || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar histórico" });
  }
});

app.post("/estudos/historico", checkToken, async (req, res) => {
  try {
    const { materia, comentario, duracaoSegundos, data, id } = req.body;
    const user = await User.findById(req.user.id);

    // Cria o objeto da sessão
    const novaSessao = { id, materia, comentario, duracaoSegundos, data };

    // 1. SALVA NO HISTÓRICO (Verifique se o nome aqui é igual ao do GET)
    if (!user.progress.historicoEstudos) {
      user.progress.historicoEstudos = [];
    }
    user.progress.historicoEstudos.unshift(novaSessao);

    // 2. ATUALIZA AS HORAS DA MATÉRIA AUTOMATICAMENTE
    const matIdx = user.progress.materias.findIndex(m => m.nome === materia);
    if (matIdx !== -1) {
      // Soma os segundos convertidos em horas
      user.progress.materias[matIdx].horasEstudadas += duracaoSegundos / 3600;
    }

    // AVISAR O MONGO QUE O OBJETO PROGRESS MUDOU
    user.markModified('progress');
    await user.save();

    res.json(novaSessao);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Erro ao salvar sessão de estudo" });
  }
});

// HISTÓRICO DE ESTUDOS
app.post("/estudos/historico", checkToken, async (req, res) => {
  try {
    const { materia, comentario, duracaoSegundos, data, id } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

    const novaSessao = { id, materia, comentario, duracaoSegundos, data };

    // GARANTIA: Se a chave não existir no banco ainda, nós criamos agora
    if (!user.progress.historicoEstudos) {
      user.progress.historicoEstudos = [];
    }

    // Adiciona a nova sessão
    user.progress.historicoEstudos.unshift(novaSessao);

    // Atualiza as horas na matéria correspondente
    if (user.progress.materias) {
      const matIdx = user.progress.materias.findIndex(m => m.nome === materia);
      if (matIdx !== -1) {
        user.progress.materias[matIdx].horasEstudadas += (duracaoSegundos / 3600);
      }
    }

    // ESSENCIAL: O Mongo precisa disso para salvar objetos aninhados (Mixed)
    user.markModified('progress');
    
    await user.save();
    console.log("✅ Sessão salva com sucesso!");
    res.json(novaSessao);
  } catch (e) {
    console.error("❌ Erro ao salvar histórico:", e);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

// TREINOS
app.post("/treinos", checkToken, async (req, res) => {
  const { nome, categoria, duracao, exercicios } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const novoTreino = { id: crypto.randomUUID(), nome, categoria, duracao, exercicios };
    
    if(!user.progress.treinos) user.progress.treinos = [];
    user.progress.treinos.push(novoTreino);
    
    user.markModified('progress');
    await user.save();
    res.status(201).json(novoTreino);
  } catch (e) { res.status(500).send(e); }
});

// --- CONEXÃO DB ---
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`)
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando e MongoDB conectado!`));
  })
  .catch(err => console.log(err));