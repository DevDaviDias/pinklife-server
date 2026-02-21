const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// POST /saude
router.post("/", checkToken, async (req, res) => {
  try {
    const { data, menstruando, intensidadeFluxo, sintomas, notas } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.progress.saude) user.progress.saude = {};

    user.progress.saude[data] = {
      data,
      menstruando,
      intensidadeFluxo: intensidadeFluxo || null,
      sintomas,
      notas,
    };

    user.markModified("progress");
    await user.save();
    res.json(user.progress.saude[data]);
  } catch {
    res.status(500).json({ msg: "Erro ao salvar registro de saúde" });
  }
});

module.exports = router;