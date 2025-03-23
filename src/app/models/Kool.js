const mongoose = require("mongoose");

// Definição do schema do kool
const kool = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Referência ao usuário que criou o kool (obrigatório)

    content: { type: String, maxlength: 280, default: "" },
    // Conteúdo do kool com limite de 280 caracteres, semelhante ao Twitter

    isReKool: { type: Boolean, default: false },
    isReply: { type: Boolean, default: false },
    media: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Media",
      default: undefined // Se não for fornecido, a propriedade não existirá no documento
    },
    // Array de mídias associadas ao kool, cada item contém:
    // - public_id: Identificador único do arquivo no Cloudinary (necessário para exclusão futura)
    // - url: Link da mídia armazenada no Cloudinary

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Lista de usuários que curtiram o kool

    reKools: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Lista de usuários que rekoolaram este kool

    views: { type: Number, default: 0 },
    // Contagem de visualizaçõe

    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Kool" }],
    // Lista de respostas ao kool (referência a outros kools)

    tags: [{ type: String }],
    // Lista de tags associadas ao Kool para facilitar a categorização e a busca

    parentKool: { type: mongoose.Schema.Types.ObjectId, ref: "Kool" },
    // Se for uma resposta, este campo armazena o kool original ao qual está respondendo
  },
  { timestamps: true }
  // timestamps: true adiciona automaticamente os campos createdAt e updatedAt
);

// Middleware para atualizar a contagem de visualizações
kool.methods.incrementViews = async function () {
  this.views += 1; // Incrementa a contagem de views
  await this.save(); // Salva o Kool atualizado
};

// Exporta o modelo do kool para ser utilizado no código
module.exports = mongoose.model("Kool", kool);
