const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// PUT /progress/beleza
router.put("/beleza", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.beleza = req.body;
    user.markModified("progress");
    await user.save();
    res.json(user.progress.beleza);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar beleza" });
  }
});

// PUT /progress/alimentacao
router.put("/alimentacao", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.alimentacao = req.body;
    user.markModified("progress");
    await user.save();
    res.json(user.progress.alimentacao);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar alimentação" });
  }
});

// PUT /progress/viagens
router.put("/viagens", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.viagens = req.body;
    user.markModified("progress");
    await user.save();
    res.json(user.progress.viagens);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar viagens" });
  }
});

// PUT /progress/casa
router.put("/casa", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.casa = req.body;
    user.markModified("progress");
    await user.save();
    res.json(user.progress.casa);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar casa" });
  }
});

// PUT /progress/:modulo (genérico)
router.put("/:modulo", checkToken, async (req, res) => {
  try {
    const { modulo } = req.params;
    const user = await User.findById(req.user.id);
    user.progress[modulo] = req.body;
    user.markModified("progress");
    await user.save();
    res.json(user.progress[modulo]);
  } catch {
    res.status(500).json({ msg: "Erro ao atualizar módulo" });
  }
});

module.exports = router;