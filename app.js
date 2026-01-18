const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// Porta (Render injeta PORT automaticamente)
const PORT = process.env.PORT || 3001;

// Middleware para JSON
app.use(express.json());

// Carrega .env apenas em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Models
const User = require("./models/User");

// =======================
// ROTAS
// =======================

// Rota pública
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem-vindo à nossa API" });
});

// Middleware JWT
function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado!" });
  }

  try {
    jwt.verify(token, process.env.SECRET);
    next();
  } catch (err) {
    return res.status(400).json({ msg: "Token inválido!" });
  }
}

// Rota privada
app.get("/user/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

// =======================
// AUTH
// =======================

// Registro
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body || {};

  if (!name || !email || !password || !confirmpassword) {
    return res.status(422).json({ msg: "Preencha todos os campos" });
  }

  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas não conferem" });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(422).json({ msg: "Email já cadastrado" });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  try {
    const user = new User({
      name,
      email,
      password: passwordHash,
    });

    await user.save();

    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (err) {
    res.status(500).json({ msg: "Erro no servidor" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(422).json({ msg: "Email e senha são obrigatórios" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).json({ msg: "Usuário não encontrado" });
  }

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(401).json({ msg: "Senha inválida" });
  }

  try {
    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      msg: "Autenticação realizada com sucesso!",
      token,
    });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao gerar token" });
  }
});

// =======================
// BANCO DE DADOS
// =======================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado com sucesso");
    app.listen(PORT, () =>
      console.log(`Servidor rodando na porta ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Erro ao conectar no MongoDB:", err);
  });
