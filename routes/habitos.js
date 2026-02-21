const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// GET /habitos
router.get("/", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.habitos || []);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar hábitos" });
  }
});

// POST /habitos
router.post("/", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const novo = { id: crypto.randomUUID(), ...req.body };
    if (!user.progress.habitos) user.progress.habitos = [];
    user.progress.habitos.push(novo);
    user.markModified("progress");
    await user.save();
    res.status(201).json(novo);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar hábito" });
  }
});

// PATCH /habitos/:id
router.patch("/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const idx = user.progress.habitos.findIndex(h => h.id === req.params.id);
    if (idx !== -1) {
      const h = user.progress.habitos[idx];
      h.concluido = !h.concluido;
      h.streak = h.concluido ? (h.streak + 1) : Math.max(0, h.streak - 1);
      user.markModified("progress");
      await user.save();
      res.json(h);
    } else {
      res.status(404).json({ msg: "Hábito não encontrado" });
    }
  } catch {
    res.status(500).json({ msg: "Erro ao atualizar hábito" });
  }
});

// DELETE /habitos/:id
router.delete("/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.habitos = user.progress.habitos.filter(h => h.id !== req.params.id);
    user.markModified("progress");
    await user.save();
    res.json({ msg: "Hábito excluído" });
  } catch {
    res.status(500).json({ msg: "Erro ao excluir hábito" });
  }
});

module.exports = router;