const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // URL do arquivo no Cloudinary
    type: { type: String, enum: ["image", "video", "gif"], default: "image" }, // Tipo do arquivo
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Referência ao usuário que fez o upload
    public_id: { type: String, required: true }, // ID do arquivo no Cloudinary para facilitar exclusão
    size: { type: Number, required: false }, // Tamanho do arquivo em bytes
    width: { type: Number, required: false }, // Largura da imagem/vídeo (opcional)
    height: { type: Number, required: false }, // Altura da imagem/vídeo (opcional)
    createdAt: { type: Date, default: Date.now }, // Data de criação
  },
  { timestamps: true }
);

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;
