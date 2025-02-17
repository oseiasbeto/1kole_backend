const Notification = require("../../../models/Notification");

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params; // O id da notificação é passado como parâmetro

    // Buscar a notificação pelo ID
    const notification = await Notification.findById(notificationId);

    // Verifica se a notificação existe
    if (!notification) {
      return res.status(404).json({ message: "Notificação não encontrada." });
    }

    // Deleta a notificação
    await notification.deleteOne(); // Exclui a notificação do banco de dados

    // Responde com sucesso
    res.status(200).json({ message: "Notificação excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

module.exports = deleteNotification;
