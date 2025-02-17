const mongoose = require("mongoose");

// Definição do schema para notificações
const notification = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Referência ao usuário que está recebendo a notificação
      required: true
    },
    type: {
      type: String,
      enum: ["like", "mention", "follow", "reply", "rekool", "message", "other"],
      required: true, // Tipo da notificação (exemplo: "like", "mention", "follow")
    },
    message: {
      type: String,
      required: true, // Mensagem da notificação
      maxlength: 280, // Limite de 280 caracteres (pode variar dependendo do tipo de notificação)
    },
    isRead: {
      type: Boolean,
      default: false, // Marca se a notificação foi lida ou não
    },
    relatedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Usuários relacionados à notificação (quem curtiu, quem mencionou, etc.)
    }],
    relatedKool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kool", // Referência ao "Kool" relacionado (se a notificação for sobre um kool)
      required: false,
    },
    isUrgent: {
      type: Boolean,
      default: false, // Define se a notificação é urgente (por exemplo, para mensagens diretas)
    },
    extraData: {
      type: mongoose.Schema.Types.Mixed, // Campo para dados adicionais relacionados à notificação
      required: false, // Dados extras podem ser armazenados aqui
    }
  },
  { timestamps: true }
);

// Middleware para marcar notificações como lidas
notification.methods.markAsRead = async function () {
  this.isRead = true; // Marca a notificação como lida
  await this.save(); // Salva a notificação com o status atualizado
};

// Exporta o modelo da notificação
module.exports = mongoose.model("Notification", notification);
