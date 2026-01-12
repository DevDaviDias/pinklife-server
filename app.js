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
//config json response



//Modules

//open Route - public route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vinda a nossa Api" });
});

//private Route
app.get("/user/:id",checkToken,  async (req, res) => {
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
function checkToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){
        return res.status(401).json({msg:'Acesso negado!'})
    }
    try{
        const secret = process.env.SECRET
        jwt.verify(token, secret )
        next()

        }catch(erro){
         res.status(400).json({msg:"token inválido!"})
        }
    
}

//Register
app.post("/auth/register", async (req, res) => {
  // usa let para poder alterar depois
  let { name, email, password, confirmpassword } = req.body || {};

  // Limpa espaços extras
  name = name?.trim();
  email = email?.trim();
  password = password?.trim();
  confirmpassword = confirmpassword?.trim();

  //validações
  if (!name) return res.status(422).json({ msg: "Nome é obrigatório" });
  if (!email) return res.status(422).json({ msg: "Email é obrigatório" });
  if (!password) return res.status(422).json({ msg: "Senha é obrigatório" });
  if (!confirmpassword) return res.status(422).json({ msg: "Confirmação de senha é obrigatória" });
  if (password !== confirmpassword) return res.status(422).json({ msg: "Senhas não conferem" });

  //verificar se usuario existe
  const userExists = await User.findOne({ email });

  if (userExists) return res.status(422).json({ msg: "Por favor utilize outro email!" });

  //create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //create user
  const user = new User({ name, email, password: passwordHash });

  try {
    await user.save();
    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente mais tarde!" });
  }
});

app.post("/auth/login", async (req, res) => {
  let { email, password } = req.body || {};

  email = email?.trim();
  password = password?.trim();

  if (!email) return res.status(422).json({ msg: "Email é obrigatório" });
  if (!password) return res.status(422).json({ msg: "Senha é obrigatório" });

  const user = await User.findOne({ email });
  if (!user) return res.status(422).json({ msg: "Usuário não encontrado!" });

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) return res.status(404).json({ msg: "Senha inválida" });

  try {
    const secret = process.env.SECRET;
    const token = jwt.sign({ id: user._id }, secret);
    res.status(200).json({ msg: "Autenticação realizada com sucesso!", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente mais tarde!" });
  }
});

app.get("/user/me", checkToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});
app.get("/user/me", checkToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

//credenciais
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`,
  )
  .then(() => {
    app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
  })
  .catch((err) => console.log(err));
