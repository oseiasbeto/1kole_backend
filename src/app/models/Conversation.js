const mongoose = require("mongoose");

// Definição do schema para conversas (Conversations)
const conversation = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
      // Armazena os participantes da conversa (pode ser mais de dois)
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message", // Referência à última mensagem da conversa
      required: false,
    },
    isGroup: {
      type: Boolean,
      default: false, // Define se a conversa é um grupo (para conversas mais complexas)
    }
  },
  { timestamps: true } // Adiciona automaticamente campos createdAt e updatedAt
);

// Exportando o modelo da conversa
module.exports = mongoose.model("Conversation", conversation);
