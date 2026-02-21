const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// GET /estudos/materias
router.get("/materias", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.materias || []);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar matérias" });
  }
});

// POST /estudos/materias
router.post("/materias", checkToken, async (req, res) => {
  const { nome, metaHoras } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const novaMateria = {
      id: crypto.randomUUID(),
      nome,
      metaHoras: Number(metaHoras),
      horasEstudadas: 0,
    };
    if (!user.progress.materias) user.progress.materias = [];
    user.progress.materias.push(novaMateria);
    user.markModified("progress");
    await user.save();
    res.status(201).json(novaMateria);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar matéria" });
  }
});

// POST /estudos/materias/update-list
router.post("/materias/update-list", checkToken, async (req, res) => {
  try {
    const { materias } = req.body;
    const user = await User.findById(req.user.id);
    user.progress.materias = materias;
    user.markModified("progress");
    await user.save();
    res.json({ msg: "Lista atualizada" });
  } catch {
    res.status(500).json({ msg: "Erro ao atualizar lista" });
  }
});

// GET /estudos/historico
router.get("/historico", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.historicoEstudos || []);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar histórico" });
  }
});

// POST /estudos/historico
router.post("/historico", checkToken, async (req, res) => {
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

    if (!user.progress.historicoEstudos) user.progress.historicoEstudos = [];
    user.progress.historicoEstudos.unshift(novaSessao);

    // Atualiza horas na matéria
    if (user.progress.materias) {
      const matIdx = user.progress.materias.findIndex(m => m.nome === materia);
      if (matIdx !== -1) {
        user.progress.materias[matIdx].horasEstudadas += duracaoSegundos / 3600;
      }
    }

    user.markModified("progress");
    await user.save();
    res.status(201).json(novaSessao);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar sessão" });
  }
});

module.exports = router;