const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// POST /financas
router.post("/", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const novaTransacao = { ...req.body, id: Date.now().toString() };
    if (!user.progress.financas) user.progress.financas = [];
    user.progress.financas.unshift(novaTransacao);
    user.markModified("progress");
    await user.save();
    res.status(201).json(novaTransacao);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar transação" });
  }
});

// DELETE /financas/:id
router.delete("/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.financas = user.progress.financas.filter(
      t => String(t.id) !== req.params.id
    );
    user.markModified("progress");
    await user.save();
    res.json({ msg: "Transação excluída" });
  } catch {
    res.status(500).json({ msg: "Erro ao excluir transação" });
  }
});

module.exports = router;