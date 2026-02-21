const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const checkToken = require("../middleware/checkToken");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// GET /diario
router.get("/", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.progress.diario || []);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar diário" });
  }
});

// POST /diario/upload
router.post("/upload", checkToken, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "Nenhuma foto enviada" });

    cloudinary.uploader.upload_stream(
      { folder: `diario/${req.user.id}` },
      async (error, response) => {
        if (error) return res.status(500).json({ msg: "Erro ao enviar imagem" });

        const user = await User.findById(req.user.id);
        if (!user.progress.diario) user.progress.diario = [];

        const novaEntrada = {
          id: crypto.randomUUID(),
          data: new Date().toISOString(),
          texto: req.body.texto || "",
          humor: req.body.humor || "✨",
          destaque: req.body.destaque || "",
          fotoUrl: response.secure_url,
        };

        user.progress.diario.unshift(novaEntrada);

        // Limite de 100 entradas
        if (user.progress.diario.length > 100) user.progress.diario.pop();

        user.markModified("progress");
        await user.save();
        res.status(201).json(novaEntrada);
      }
    ).end(req.file.buffer);
  } catch {
    res.status(500).json({ msg: "Erro no upload" });
  }
});

// DELETE /diario/:id
router.delete("/:id", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.progress.diario = (user.progress.diario || []).filter(
      item => item.id !== req.params.id
    );
    user.markModified("progress");
    await user.save();
    res.json({ msg: "Entrada do diário removida" });
  } catch {
    res.status(500).json({ msg: "Erro ao excluir entrada" });
  }
});

module.exports = router;