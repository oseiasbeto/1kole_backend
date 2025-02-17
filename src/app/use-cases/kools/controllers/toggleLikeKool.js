const Kool = require('../../../models/Kool'); // Importa o modelo Kool para interagir com a coleção de kools no banco de dados
const User = require('../../../models/User'); // Importa o modelo User para buscar dados do usuário
const Notification = require('../../../models/Notification'); // Importa o modelo Notification para interagir com as notificações

// Função para dar like ou deslike em um kool (toggle)
const toggleLikeKool = async (req, res) => {
  const koolId = req.params.id; // Recupera o ID do kool a partir dos parâmetros da URL
  const userId = req.user.id; // Recupera o ID do usuário da sessão autenticada (req.user)
  let notificationOccurred = false; // Indica se uma notificação foi gerada durante o processo. Inicialmente definida como falsa.

  try {
    // Verifica se o usuário atual existe no banco de dados
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' }); // Se o usuário não for encontrado, retorna erro 404
    }

    // Encontra o kool pelo ID
    const kool = await Kool.findById(koolId);

    // Se o kool não for encontrado, retorna erro 404
    if (!kool) {
      return res.status(404).json({ message: 'Kool não encontrado' });
    }

    // Verifica se o autor do kool existe no banco de dados
    const author = await User.findOne({
      _id: kool.author
    });

    // Se o autor não for encontrado, retorna erro 400
    if (!author) {
      return res.status(400).send({ message: "O autor do kool não foi encontrado" });
    }

    // Verifica se o usuário já curtiu o kool, se sim, remove o like (deslike)
    if (kool.likes.includes(userId)) {
      kool.likes = kool.likes.filter(like => like.toString() !== userId); // Remove o ID do usuário da lista de likes
      await kool.save(); // Salva a alteração no banco

      return res.status(200).json({ message: 'Like removido com sucesso', notificationOccurred });
    }

    // Caso contrário, adiciona o like
    kool.likes.push(userId); // Adiciona o usuário à lista de likes
    await kool.save(); // Salva o kool atualizado no banco de dados

    // Verifica se já existe uma notificação para o tipo "like" para o autor do kool
    const existingNotification = await Notification.findOne({
      user: kool.author, // O autor do kool vai receber a notificação
      type: 'like', // Tipo da notificação
      relatedKool: koolId, // Referência ao kool que foi curtido
    });

    if (existingNotification) {
      // Busca os usuários que já estão na notificação
      let usersList = await User.find({ _id: { $in: existingNotification.relatedUsers } });

      // Verifica se o usuário já está na notificação
      if (!usersList.some(u => u._id.toString() === userId)) {
        // Adiciona o novo usuário à lista de usuários relacionados
        const newUser = await User.findById(userId);

        if (newUser) {
          usersList.push(newUser);

          // Extrai os nomes dos usuários
          const usersListNames = usersList.map(u => u.name);

          // Define a mensagem conforme o número de usuários
          let notificationMessage;
          if (usersList.length === 1) {
            notificationMessage = `${usersListNames[0]} curtiu seu kool!`;
          } else {
            const maxUsers = 2;
            const remainingUsers = usersList.length - maxUsers;
            notificationMessage = `${usersListNames.slice(0, maxUsers).join(', ')}${remainingUsers > 0 ? ` e mais ${remainingUsers} ${remainingUsers === 1 ? 'pessoa curtiu' : 'pessoas curtiram'}` : ' curtiram'} seu kool!`;
          }

          await Notification.updateOne(
            { _id: existingNotification._id },
            {
              $set: { message: notificationMessage },
              $addToSet: { relatedUsers: userId },
            }
          );
        }
      }
    } else {
      // Cria uma nova notificação se o autor do Kool não for o próprio usuário
      if (kool.author.toString() !== userId) {
        const user = await User.findById(userId);
        if (user) {
          const notificationMessage = `${user.name} curtiu seu kool!`;
          const notification = new Notification({
            user: kool.author,
            type: 'like',
            message: notificationMessage,
            relatedUsers: [userId],
            relatedKool: koolId,
          });

          await notification.save();

          // Incrementa o contador de notificações não lidas do autor do kool
          await User.updateOne({ _id: kool.author }, { $inc: { unreadNotificationsCount: 1 } });

          notificationOccurred = true
        }
      }
    }


    // Retorna uma resposta informando que o like foi registrado com sucesso
    return res.status(200).json({ message: 'Like registrado com sucesso', notificationOccurred });
  } catch (error) {
    console.error(error); // Exibe o erro no console para diagnóstico
    return res.status(500).json({ message: 'Erro no servidor' }); // Retorna um erro genérico de servidor
  }
};

// Exporta a função toggleLikeKool para ser usada em outras partes da aplicação
module.exports = toggleLikeKool;