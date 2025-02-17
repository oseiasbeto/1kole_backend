const Notification = require("../../../models/Notification");

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params; // O id da notificação é passado como parâmetro

    // Buscar a notificação pelo ID
    const notification = await Notification.findById(notificationId);

    // Verifica se a notificação existe
    if (!notification) {
      return res.status(404).json({ message: "Notificação não encontrada." });
    }

    // Marca a notificação como lida
    notification.isRead = true;
    await notification.save(); // Salva a alteração no banco de dados

    // Responde com sucesso
    res.status(200).json({ message: "Notificação marcada como lida." });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

module.exports = markAsRead;
