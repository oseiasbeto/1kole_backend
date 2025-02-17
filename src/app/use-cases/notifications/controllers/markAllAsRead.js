const Notification = require("../../../models/Notification");

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // O id do usuário 

    // Marca todas as notificações do usuário como lidas
    await Notification.updateMany(
      { user: userId, isRead: false }, // Filtra notificações não lidas
      { isRead: true } // Atualiza o status para 'lida'
    );

    // Responde com sucesso
    res.status(200).json({ message: "Todas as notificações foram marcadas como lidas." });
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

module.exports = markAllAsRead;
