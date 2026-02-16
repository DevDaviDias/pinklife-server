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

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // 


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
// Adicione isso no seu app.js do Backend
app.get("/user/me", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar dados do usuário" });
  }
});

app.post("/auth/register", async (req, res) => {
  let { name, email, password, confirmpassword } = req.body || {};
  if (password !== confirmpassword) return res.status(422).json({ msg: "Senhas não conferem" });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  
const user = new User({ 
    name, 
    email, 
    password: passwordHash, 
    // Usamos o padrão definido no Model, mas garantimos os objetos vazios aqui
    progress: {
      tarefas: [], 
      habitos: [],
      materias: [],
      historicoEstudos: [],
      treinos: [],
      financas: [],
      saude: {},
      beleza: {
        skincareManha: { limpador: false, tonico: false, hidratante: false, protetor: false },
        skincareNoite: { demaquilante: false, limpador: false, serum: false, hidratante: false },
        cronogramaCapilar: "Hidratação"
      },
      alimentacao: { refeicoes: { cafe: "", almoco: "", lanche: "", jantar: "" }, compras: [] },
      viagens: { mala: [] },
      casa: { tarefas: [], cardapio: { almoco: "", jantar: "" } }
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
    res.json(user.progress.tarefas || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar tarefas" });
  }
});

app.post("/agenda/tarefas", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.progress.tarefas) user.progress.tarefas = [];

    const novaTarefa = {
      id: crypto.randomUUID(),
      ...req.body,
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

// ROTA ADICIONADA: Para atualizar a lista (excluir matéria)
app.post("/estudos/materias/update-list", checkToken, async (req, res) => {
  try {
    const { materias } = req.body;
    const user = await User.findById(req.user.id);
    user.progress.materias = materias;
    user.markModified('progress');
    await user.save();
    res.json({ msg: "Lista atualizada" });
  } catch (e) {
    res.status(500).json({ msg: "Erro ao atualizar lista" });
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

// ROTA ADICIONADA: Para buscar o histórico (GET)
app.get("/estudos/historico", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.historicoEstudos || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar histórico" });
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

    // Atualiza as horas na matéria correspondente
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


// --- ROTAS DE HÁBITOS ---
app.get("/habitos", checkToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.progress.habitos || []);
});

app.post("/habitos", checkToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  const novo = { id: crypto.randomUUID(), ...req.body };
  if(!user.progress.habitos) user.progress.habitos = [];
  user.progress.habitos.push(novo);
  user.markModified('progress');
  await user.save();
  res.status(201).json(novo);
});

app.patch("/habitos/:id", checkToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  const { id } = req.params;
  const idx = user.progress.habitos.findIndex(h => h.id === id);
  if(idx !== -1) {
    const h = user.progress.habitos[idx];
    h.concluido = !h.concluido;
    h.streak = h.concluido ? (h.streak + 1) : Math.max(0, h.streak - 1);
    user.markModified('progress');
    await user.save();
    res.json(h);
  }
});

app.delete("/habitos/:id", checkToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.progress.habitos = user.progress.habitos.filter(h => h.id !== req.params.id);
  user.markModified('progress');
  await user.save();
  res.json({ msg: "Excluído" });
});

app.put("/progress/beleza", checkToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.progress.beleza = req.body;
        user.markModified('progress');
        await user.save();
        res.json(user.progress.beleza);
    } catch (err) {
        res.status(500).json({ msg: "Erro ao salvar beleza" });
    }
});

app.put("/progress/alimentacao", checkToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.progress.alimentacao = req.body;
    user.markModified('progress');
    await user.save();
    res.json(user.progress.alimentacao);
});

app.put("/progress/viagens", checkToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.progress.viagens = req.body;
        user.markModified('progress');
        await user.save();
        res.json(user.progress.viagens);
    } catch (err) {
        res.status(500).json({ msg: "Erro ao salvar mala" });
    }
});

app.put("/progress/casa", checkToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.progress.casa = req.body;
    user.markModified('progress');
    await user.save();
    res.json(user.progress.casa);
});

// ROTA GENÉRICA (Opcional, mas recomendada)
app.put("/progress/:modulo", checkToken, async (req, res) => {
    try {
        const { modulo } = req.params;
        const user = await User.findById(req.user.id);
        
        // Atualiza dinamicamente o módulo enviado (ex: 'casa', 'viagens')
        user.progress[modulo] = req.body;
        
        user.markModified('progress');
        await user.save();
        res.json(user.progress[modulo]);
    } catch (err) {
        res.status(500).json({ msg: "Erro ao atualizar módulo" });
    }
});


app.get("/diario", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.diario || []);
  } catch (e) {
    res.status(500).json({ msg: "Erro ao buscar diário" });
  }
});

// UPLOAD + CRIAR ENTRADA
app.post("/diario/upload", checkToken, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "Nenhuma foto enviada" });

    cloudinary.uploader.upload_stream(
      { folder: `diario/${req.user.id}` },
      async (error, response) => {
        if (error) return res.status(500).json({ msg: "Erro ao enviar imagem", error });

        const user = await User.findById(req.user.id);
        if (!user.progress.diario) user.progress.diario = [];

        const novaEntrada = {
          id: crypto.randomUUID(),
          data: new Date().toISOString(),
          texto: req.body.texto || "",
          humor: req.body.humor || "✨",
          destaque: req.body.destaque || "",
          fotoUrl: response.secure_url
        };

        user.progress.diario.unshift(novaEntrada);

        // 🔥 Limite de 100 entradas
        if (user.progress.diario.length > 100) {
          user.progress.diario.pop();
        }

        user.markModified("progress");
        await user.save();

        res.status(201).json(novaEntrada);
      }
    ).end(req.file.buffer);

  } catch (err) {
    res.status(500).json({ msg: "Erro no upload", err });
  }
});

// EXCLUIR ENTRADA
app.delete("/diario/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.progress.diario = (user.progress.diario || []).filter(
      (item) => item.id !== req.params.id
    );

    user.markModified("progress");
    await user.save();

    res.json({ msg: "Entrada do diário removida" });
  } catch (e) {
    res.status(500).json({ msg: "Erro ao excluir entrada" });
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