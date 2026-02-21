if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

// --- Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Rotas ---
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/perfil"));
app.use("/agenda", require("./routes/agenda"));
app.use("/estudos", require("./routes/estudos"));
app.use("/treinos", require("./routes/treinos"));
app.use("/financas", require("./routes/financas"));
app.use("/saude", require("./routes/saude"));
app.use("/habitos", require("./routes/habitos"));
app.use("/diario", require("./routes/diario"));
app.use("/progress", require("./routes/progress"));

// --- Conexão DB ---
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const PORT = process.env.PORT || 3001;

mongoose
  .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xvyco85.mongodb.net/?appName=Cluster0`)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ Servidor rodando na porta ${PORT} e MongoDB conectado!`)
    );
  })
  .catch(err => console.log("❌ Erro ao conectar no MongoDB:", err));