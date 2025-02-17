const mongoose = require("mongoose");

// Definição do schema para mensagens (Messages)
const message = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true, // Referência à conversa a qual a mensagem pertence
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Referência ao usuário que enviou a mensagem
      required: true,
    },
    content: {
      type: String,
      required: true, // Conteúdo da mensagem
      maxlength: 1000, // Limite de caracteres
    },
    isRead: {
      type: Boolean,
      default: false, // Marca se a mensagem foi lida
    }
  },
  { timestamps: true } // Adiciona automaticamente campos createdAt e updatedAt
);

// Exportando o modelo da mensagem
module.exports = mongoose.model("Message", message);
