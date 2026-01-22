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
app.get("/estudos/materias", checkToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.progress.materias || []);
});

app.post("/estudos/materias", checkToken, async (req, res) => {
  const { nome, metaHoras } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const novaMateria = { id: crypto.randomUUID(), nome, metaHoras: Number(metaHoras), horasEstudadas: 0 };
    
    if(!user.progress.materias) user.progress.materias = [];
    user.progress.materias.push(novaMateria);
    
    user.markModified('progress');
    await user.save();
    res.status(201).json(novaMateria);
  } catch (e) { res.status(500).send(e); }
});

// HISTÓRICO DE ESTUDOS
app.post("/estudos/historico", checkToken, async (req, res) => {
  const { materia, comentario, duracaoSegundos, data } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const novaSessao = {
      id: crypto.randomUUID(),
      materia,
      comentario: comentario || "",
      duracaoSegundos: Number(duracaoSegundos),
      data: data || new Date().toISOString(),
    };

    user.progress.historicoEstudos.unshift(novaSessao);

    const matIdx = user.progress.materias.findIndex(m => m.nome === materia);
    if (matIdx !== -1) {
      user.progress.materias[matIdx].horasEstudadas += duracaoSegundos / 3600;
    }

    user.markModified('progress');
    await user.save();
    res.status(201).json(novaSessao);
  } catch (e) { res.status(500).send(e); }
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