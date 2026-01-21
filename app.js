/* backend/index.js */
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const User = require("./models/User.js");
const PORT = process.env.PORT || 3001;

// Middleware de autenticação
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

// --- ROTAS PÚBLICAS ---
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vinda a nossa Api" });
});

// --- ROTA NOVA: USER ME (Resolve o erro 404 do Axios) ---
app.get("/user/me", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado!" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar usuário" });
  }
});

app.post("/auth/register", async (req, res) => {
  let { name, email, password, confirmpassword } = req.body || {};
  if (password !== confirmpassword) return res.status(422).json({ msg: "Senhas não conferem" });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  
  // Garantimos que o usuário comece com um objeto progress vazio
  const user = new User({ name, email, password: passwordHash, progress: {} });

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

// --- ROTAS DE PROGRESSO ---

// SALVAR
app.post("/user/progress", checkToken, async (req, res) => {
  const { module, data } = req.body; 
  const userId = req.user.id;

  try {
    // Usamos o [module] dinâmico para salvar em progress.agenda, progress.treino, etc.
    await User.findByIdAndUpdate(userId, {
      $set: { [`progress.${module}`]: data }
    });
    res.status(200).json({ msg: "Dados salvos com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao salvar dados" });
  }
});

// BUSCAR
app.get("/user/progress", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // Retornamos exatamente o objeto progress para o Contexto ler
    res.status(200).json({ progress: user.progress || {} });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar dados" });
  }
});

app.get("/user/me", checkToken, async (req, res) => {
  try {
   
    const user = await User.findById(req.user.id).select("-_id -password -__v"); 
   
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado!" });

    // Retorna os dados seguros
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro ao buscar usuário" });
  }
});

// Exemplo em app.js ou userRoutes.js
app.post("/user/progress", checkToken, async (req, res) => {
  try {
    const { module, data } = req.body; // module = "agenda", data = { tarefas: [...] }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

    // Atualiza o módulo específico (agenda, habitos, treinos...)
    user.progress[module] = data;

    await user.save();
    res.status(200).json({ msg: "Progresso atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro ao atualizar progresso" });
  }
});

const treinos = []; // lista global temporária
// GET todos os treinos
app.get("/treinos", (req, res) => {
  res.json(treinos);
});

// POST novo treino
app.post("/treinos", (req, res) => {
  const { nome, categoria, duracao, exercicios } = req.body;
  const novoTreino = { id: crypto.randomUUID(), nome, categoria, duracao, exercicios };
  treinos.push(novoTreino);
  res.status(201).json(novoTreino);
});

// DELETE treino
app.delete("/treinos/:id", (req, res) => {
  const { id } = req.params;
  const index = treinos.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ msg: "Treino não encontrado" });
  treinos.splice(index, 1);
  res.json({ msg: "Treino deletado" });
});

// Conexão DB
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`)
  .then(() => app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`)))
  .catch(err => console.log(err));