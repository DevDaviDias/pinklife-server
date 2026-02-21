const express = require("express");
const router = express.Router();
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");

// GET /user/me
router.get("/me", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar dados do usuário" });
  }
});

// PUT /user/profile
router.put("/profile", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (req.body.name) user.name = req.body.name;
    if (req.body.fotoPerfil) user.fotoPerfil = req.body.fotoPerfil;
    await user.save();
    res.json({ msg: "Perfil atualizado!" });
  } catch {
    res.status(500).json({ msg: "Erro ao atualizar perfil" });
  }
});

module.exports = router;