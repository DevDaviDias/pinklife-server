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
      tarefas: [], // AGORA NA RAIZ DO PROGRESS
      materias: [],
      historicoEstudos: [],
      treinos: [],
      financas: [],
      saude: {} 
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

// --- ROTA DA AGENDA (TAREFAS) ---

app.get("/agenda/tarefas", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // Retorna o array da raiz ou vazio se não existir
    res.json(user.progress.tarefas || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar tarefas" });
  }
});

app.post("/agenda/tarefas", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Segurança para usuários antigos em produção
    if (!user.progress.tarefas) {
      user.progress.tarefas = [];
    }

    const novaTarefa = {
      id: crypto.randomUUID(),
      ...req.body, // Espera titulo, horario, concluida
      concluida: req.body.concluida || false
    };

    user.progress.tarefas.push(novaTarefa);
    user.markModified('progress');
    await user.save();

    res.status(201).json(novaTarefa);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao salvar tarefa" });
  }
});

app.patch("/agenda/tarefas/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { id } = req.params;

    const tarefaIdx = user.progress.tarefas.findIndex(t => t.id === id);
    if (tarefaIdx !== -1) {
      user.progress.tarefas[tarefaIdx].concluida = !user.progress.tarefas[tarefaIdx].concluida;
      user.markModified('progress');
      await user.save();
      res.json(user.progress.tarefas[tarefaIdx]);
    } else {
      res.status(404).json({ msg: "Tarefa não encontrada" });
    }
  } catch (e) {
    res.status(500).json({ msg: "Erro ao atualizar tarefa" });
  }
});

// --- ROTAS DE ESTUDOS (MATÉRIAS E HISTÓRICO) ---

app.get("/estudos/materias", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.materias || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar matérias" });
  }
});

app.post("/estudos/materias", checkToken, async (req, res) => {
  const { nome, metaHoras } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const novaMateria = { 
      id: crypto.randomUUID(), 
      nome, 
      metaHoras: Number(metaHoras), 
      horasEstudadas: 0 
    };
    
    if(!user.progress.materias) user.progress.materias = [];
    user.progress.materias.push(novaMateria);
    
    user.markModified('progress');
    await user.save();
    res.status(201).json(novaMateria);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao salvar matéria" });
  }
});

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

    if(!user.progress.historicoEstudos) user.progress.historicoEstudos = [];
    user.progress.historicoEstudos.unshift(novaSessao);

    if (user.progress.materias) {
      const matIdx = user.progress.materias.findIndex(m => m.nome === materia);
      if (matIdx !== -1) {
        user.progress.materias[matIdx].horasEstudadas += (duracaoSegundos / 3600);
      }
    }

    user.markModified('progress');
    await user.save();
    res.status(201).json(novaSessao);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao salvar sessão" });
  }
});

// --- ROTAS DE TREINOS ---

app.get("/treinos", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.treinos || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar treinos" });
  }
});

app.post("/treinos", checkToken, async (req, res) => {
  try {
    const { nome, categoria, duracao, exercicios } = req.body;
    const user = await User.findById(req.user.id);

    const novoTreino = { 
      id: crypto.randomUUID(), 
      nome, 
      categoria: categoria || "Musculação", 
      duracao: duracao || "45 min", 
      exercicios: exercicios || [] 
    };

    if (!user.progress.treinos) user.progress.treinos = [];
    user.progress.treinos.unshift(novoTreino);
    
    user.markModified('progress');
    await user.save();
    res.status(201).json(novoTreino);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao salvar treino" });
  }
});

// --- FINANCEIRO ---

app.post("/financas", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const novaTransacao = { ...req.body, id: Date.now() };

    if (!user.progress.financas) user.progress.financas = [];
    
    user.progress.financas.unshift(novaTransacao);
    user.markModified('progress');
    await user.save();

    res.status(201).json(novaTransacao);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao salvar transação" });
  }
});

// --- SAÚDE ---

app.post("/saude", checkToken, async (req, res) => {
  try {
    const { data, menstruando, sintomas, notas } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.progress.saude) user.progress.saude = {};

    user.progress.saude[data] = {
      data,
      menstruando,
      sintomas,
      notas
    };

    user.markModified('progress');
    await user.save();

    res.json(user.progress.saude[data]);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao salvar registro de saúde" });
  }
});

// --- CONEXÃO DB ---
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`)
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} e MongoDB conectado!`));
  })
  .catch(err => console.log("Erro ao conectar no MongoDB:", err));