
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

// Portas diferentes para ambiente de desenvolvimento e produção
const PORT = process.env.PORT || 3001;

// Configuração para respostas em JSON
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
// Models
const User = require("./models/User.js");

// Rota pública
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem-vindo à nossa API" });
});

// Rota privada
app.get("/user/:id", checkToken, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro interno no servidor ou ID inválido" });
  }
});

// Middleware para verificar o token JWT
function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado!" });
  }

  try {
    const secret = process.env.SECRET;
    jwt.verify(token, secret);
    next();
  } catch (erro) {
    res.status(400).json({ msg: "Token inválido!" });
  }
}

// Registro de usuário
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body || {};

  // Validações
  if (!name) {
    return res.status(422).json({ msg: "Nome é obrigatório" });
  }
  if (!email) {
    return res.status(422).json({ msg: "Email é obrigatório" });
  }
  if (!password) {
    return res.status(422).json({ msg: "Senha é obrigatória" });
  }
  if (!confirmpassword) {
    return res.status(422).json({ msg: "Confirmação de senha é obrigatória" });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas não conferem" });
  }

  // Verificar se o usuário já existe
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro email!" });
  }

  // Criação da senha criptografada
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Criação do usuário
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();
    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({
      msg: "Aconteceu um erro no servidor, tente novamente mais tarde!",
    });
  }
});

// Login do usuário
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email) {
    return res.status(422).json({ msg: "Email é obrigatório" });
  }
  if (!password) {
    return res.status(422).json({ msg: "Senha é obrigatória" });
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(422).json({ msg: "Usuário não encontrado!" });
  }

  // Verificar se a senha corresponde
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(404).json({ msg: "Senha inválida" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      { id: user.id },
      secret
    );

    res.status(200).json({
      msg: "Autenticação realizada com sucesso!",
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "Aconteceu um erro no servidor, tente novamente mais tarde!",
    });
  }
});

// Credenciais do banco de dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

// Conexão com o MongoDB
mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`
  )
  .then(() => {
    app.listen(PORT, () => console.log("Servidor rodando!"));
  })
  .catch((err) => console.log(err));
