if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cors = require('cors');
app.use(cors());
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

const PORT = process.env.PORT || 3001;
//config json response
app.use(express.json());

//Modules
const User = require("./models/User.js");
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
  const { name, email, password, confirmpassword } = req.body || {};

  //validações
  if (!name) {
    return res.status(422).json({ msg: "nome é obrigatório" });
  }
  if (!email) {
    return res.status(422).json({ msg: "Email é obrigatório" });
  }
  if (!password) {
    return res.status(422).json({ msg: "Senha é obrigatório" });
  }
  if (!confirmpassword) {
    return res.status(422).json({ msg: "Senha é obrigatório" });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "Senha não conferem" });
  }
  //verificar se usuario existe
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor ultlize putro email!" });
  }

  //create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //create user
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  //login user
  

  try {
    await user.save();
    res.status(201).json({ msg: "Usuario criado com sucesso!" });
  } catch (error) {
    res
      .status(500)
      .json({
        msg: "Aconteceu um erro no servidor, tente novamnete mais tarde!",
      });
  }
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email) {
      return res.status(422).json({ msg: "Email é obrigatório" });
    }
    if (!password) {
      return res.status(422).json({ msg: "Senha é obrigatório" });
    }
      const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(422).json({ msg: "Usuario não encontrado!" });
  }
  //chef if password match
  const checkPassword = await bcrypt.compare(password,user.password )
  if(!checkPassword){
    return res.status(404).json({ msg: "Senha é inválida" });
  }
try{
  const secret = process.env.SECRET
  const token = jwt.sign({id:user.id},
    secret,
  )
res.status(200).json({msg: "Autenticação realizada com sucesso!", token})
}catch(err){
    console.log(error)
    res.status(500)
      .json({
        msg: "Aconteceu um erro no servidor, tente novamnete mais tarde!",
      });
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
