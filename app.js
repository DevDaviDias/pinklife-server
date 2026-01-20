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
    req.user = decoded; // ✅ Adiciona o ID (id) do usuário ao request
    next();
  } catch (erro) {
    res.status(400).json({ msg: "Token inválido!" });
  }
}

// --- ROTAS PÚBLICAS ---
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vinda a nossa Api" });
});

app.post("/auth/register", async (req, res) => {
  let { name, email, password, confirmpassword } = req.body || {};
  if (password !== confirmpassword) return res.status(422).json({ msg: "Senhas não conferem" });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
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

// --- ROTAS DE PROGRESSO (Para todas as páginas) ---

// SALVAR (Saúde, Alimentação, Treino, etc.)
app.post("/user/progress", checkToken, async (req, res) => {
  const { module, data } = req.body; 
  const userId = req.user.id;

  try {
    // Atualiza apenas a gaveta do módulo dentro do objeto 'progress'
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
    res.status(200).json({ progress: user.progress || {} });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar dados" });
  }
});

// Conexão DB
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`)
  .then(() => app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`)))
  .catch(err => console.log(err));