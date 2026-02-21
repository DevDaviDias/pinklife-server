const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// GET /treinos
router.get("/", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.treinos || []);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar treinos" });
  }
});

// POST /treinos
router.post("/", checkToken, async (req, res) => {
  try {
    const { nome, categoria, duracao, exercicios } = req.body;
    const user = await User.findById(req.user.id);
    const novoTreino = {
      id: crypto.randomUUID(),
      nome,
      categoria: categoria || "Musculação",
      duracao: duracao || "45 min",
      exercicios: exercicios || [],
    };
    if (!user.progress.treinos) user.progress.treinos = [];
    user.progress.treinos.unshift(novoTreino);
    user.markModified("progress");
    await user.save();
    res.status(201).json(novoTreino);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar treino" });
  }
});

// DELETE /treinos/:id
router.delete("/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.treinos = user.progress.treinos.filter(t => t.id !== req.params.id);
    user.markModified("progress");
    await user.save();
    res.json({ msg: "Treino excluído" });
  } catch {
    res.status(500).json({ msg: "Erro ao excluir treino" });
  }
});

module.exports = router;