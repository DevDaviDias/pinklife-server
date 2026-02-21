const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// GET /agenda/tarefas
router.get("/tarefas", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.tarefas || []);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar tarefas" });
  }
});

// POST /agenda/tarefas
router.post("/tarefas", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.progress.tarefas) user.progress.tarefas = [];

    const novaTarefa = {
      id: crypto.randomUUID(),
      ...req.body,
      concluida: req.body.concluida || false,
    };

    user.progress.tarefas.push(novaTarefa);
    user.markModified("progress");
    await user.save();
    res.status(201).json(novaTarefa);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar tarefa" });
  }
});

// PATCH /agenda/tarefas/:id
router.patch("/tarefas/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const idx = user.progress.tarefas.findIndex(t => t.id === req.params.id);
    if (idx !== -1) {
      user.progress.tarefas[idx].concluida = !user.progress.tarefas[idx].concluida;
      user.markModified("progress");
      await user.save();
      res.json(user.progress.tarefas[idx]);
    } else {
      res.status(404).json({ msg: "Tarefa não encontrada" });
    }
  } catch {
    res.status(500).json({ msg: "Erro ao atualizar tarefa" });
  }
});

// DELETE /agenda/tarefas/:id
router.delete("/tarefas/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.tarefas = user.progress.tarefas.filter(t => t.id !== req.params.id);
    user.markModified("progress");
    await user.save();
    res.json({ msg: "Tarefa excluída" });
  } catch {
    res.status(500).json({ msg: "Erro ao excluir tarefa" });
  }
});

module.exports = router;