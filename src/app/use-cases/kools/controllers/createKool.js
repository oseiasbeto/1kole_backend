// Importa o modelo Kool para interagir com os dados dos kools
const Kool = require("../../../models/Kool");

// Importa o modelo User para buscar informações do usuário
const User = require("../../../models/User");
const Media = require("../../../models/Media");

// Importa o modelo Notification para interagir com as notificações
const Notification = require("../../../models/Notification");

// Importa o modelo Notification para interagir com as notificações
const userTransformer = require("../../../utils/userTransformer");

// Importa a configuração do Cloudinary para upload de mídias
const cloudinary = require("../../../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Cria um novo Kool
 * Pode ser um Kool normal, um retweet (ReKool) ou uma resposta (Reply)
 */
const createKool = async (req, res) => {
  try {
    // Obtém o ID do usuário autenticado
    const userId = req.user.id;
    // Extrai os dados da requisição: conteúdo, Kool pai e se é um ReKool
    const { content, parentKool, isReKool } = req.body;
    // Array para armazenar os arquivos de mídia carregados
    let media = [];
    let notificationOccurred = false; // Indica se uma notificação foi gerada durante o processo. Inicialmente definida como falsa.

    // Verifica se o usuário autenticado existe no banco de dados
    const user = await User.findById(userId); // Substituímos 'author' por 'user'

    if (!user) {
      // Retorna erro caso o usuário não seja encontrado
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let originalKool = await Kool.findOne({ _id: parentKool });

    // Se for um ReKool
    if (isReKool) {
      if (!parentKool) {
        // Valida se foi passado o Kool original
        return res.status(400).json({ message: "O ReKool deve referenciar um Kool original" });
      }
      if (!originalKool) {
        // Valida se o Kool original existe
        return res.status(404).json({ message: "Kool original não encontrado" });
      }

      // Verifica se já existe um ReKool semelhante (mesmo conteúdo e autor)
      const existingReKool = await Kool.findOne({
        parentKool,
        author: userId, // Aqui agora referenciamos 'userId'
        isReKool: true, // Certifica-se de que é um ReKool
      });

      if (existingReKool) {
        // Retorna erro caso exista um ReKool semelhante
        await existingReKool.deleteOne()
        await originalKool.updateOne({ $pull: { reKools: userId } });

        return res.status(200).json({ message: "ReKool removido com sucesso!" });
      }

      // Criação do ReKool
      const reKool = new Kool({
        author: userId, // Aqui agora referenciamos 'userId'
        parentKool,
        isReKool: true
      });

      await reKool.save(); // Salva o ReKool no banco de dados

      // Adiciona o usuário à lista de ReKools do Kool original
      await originalKool.updateOne({ $addToSet: { reKools: userId } });

      // Lógica para criar ou atualizar a notificação de ReKool
      const existingReKoolNotification = await Notification.findOne({
        user: originalKool.author,
        type: 'rekool',
        relatedKool: originalKool._id,
        relatedUsers: { $nin: [userId] }, // Verifica se o usuário atual NÃO está nos relatedUsers
        isRead: false,
      });

      if (existingReKoolNotification) {
        // Busca os usuários que já estão na notificação
        let usersList = await User.find({ _id: { $in: existingReKoolNotification.relatedUsers } });

        // Verifica se o usuário já está na notificação
        if (!usersList.some(u => u._id.toString() === userId)) {
          // Adiciona o novo usuário à lista de usuários relacionados
          const newUser = await User.findById(userId);

          if (newUser && newUser._id.toString() !== originalKool.author.toString()) {
            usersList.push(newUser);

            // Extrai os nomes dos usuários
            const usersListNames = usersList.map(u => u.name);

            // Define a mensagem conforme o número de usuários
            let notificationMessage;
            if (usersList.length === 1) {
              notificationMessage = `${usersListNames[0]} fez um ReKool no seu Kool!`;
            } else {
              const maxUsers = 2;
              const remainingUsers = usersList.length - maxUsers;
              notificationMessage = `${usersListNames.slice(0, maxUsers).join(', ')}${remainingUsers > 0 ? ` e mais ${remainingUsers} ${remainingUsers === 1 ? 'pessoa fez ReKool' : 'pessoas fizeram ReKool'}` : 'fizeram ReKool'} no seu Kool!`;
            }

            await Notification.updateOne(
              { _id: existingReKoolNotification._id },
              {
                $set: { message: notificationMessage },
                $addToSet: { relatedUsers: userId },
              }
            );
          }
        }
      } else {
        // Cria a notificação se o autor do ReKool for diferente do autor do Kool original
        if (originalKool.author.toString() !== userId) {
          const user = await User.findById(userId);
          if (user) {
            const notificationMessage = `${user.name} fez um ReKool do seu Kool!`;
            const notification = new Notification({
              user: originalKool.author,
              type: 'rekool',
              message: notificationMessage,
              relatedUsers: [userId],
              relatedKool: originalKool._id,
            });
            await notification.save();
            // Incrementa o contador de ReKools para o usuário
            await User.updateOne({ _id: originalKool.author }, { $inc: { rekoolsCount: 1 } });

            notificationOccurred = true
          }
        }
      }

      return res.status(201).json({ message: "ReKool realizado com sucesso", kool: reKool, notificationOccurred });
    }

    // Se for uma resposta a um Kool (Reply)
    if (parentKool) {
      const originalKool = await Kool.findById(parentKool);
      if (!originalKool) {
        // Valida se o Kool original existe
        return res.status(404).json({ message: "Kool original não encontrado" });
      }

      const existingReplyNotification = await Notification.findOne({
        user: originalKool.author,
        type: 'reply',
        relatedKool: originalKool._id,
        isRead: false,
      });

      if (existingReplyNotification) {
        // Busca os usuários que já estão na notificação
        let usersList = await User.find({ _id: { $in: existingReplyNotification.relatedUsers } });

        // Verifica se o usuário já está na notificação
        if (!usersList.some(u => u._id.toString() === userId)) {
          // Adiciona o novo usuário à lista de usuários relacionados
          const newUser = await User.findById(userId);

          if (newUser && newUser._id.toString() !== originalKool.author.toString()) {
            usersList.push(newUser);

            // Extrai os nomes dos usuários
            const usersListNames = usersList.map(u => u.name);

            // Define a mensagem conforme o número de usuários
            let notificationMessage;
            if (usersList.length === 1) {
              notificationMessage = `${usersListNames[0]} respondeu ao seu Kool!`;
            } else {
              const maxUsers = 2;
              const remainingUsers = usersList.length - maxUsers;
              notificationMessage = `${usersListNames.slice(0, maxUsers).join(', ')}${remainingUsers > 0 ? ` e mais ${remainingUsers} ${remainingUsers === 1 ? 'pessoa respondeu' : 'pessoas responderam'}` : 'responderam'} ao seu Kool!`;
            }

            await Notification.updateOne(
              { _id: existingReplyNotification._id },
              {
                $set: { message: notificationMessage },
                $addToSet: { relatedUsers: userId },
              }
            )
          }
        }
      } else {
        // Cria a notificação se o autor da resposta não for o mesmo que o autor do Kool original
        if (originalKool.author.toString() !== userId) {
          const user = await User.findById(userId);
          if (user) {
            const notificationMessage = `${user.name} respondeu ao seu Kool!`;
            const notification = new Notification({
              user: originalKool.author,
              type: 'reply',
              message: notificationMessage,
              relatedUsers: [userId],
              relatedKool: originalKool._id,
            });
            await notification.save();

            // Incrementa o contador de notificações não lidas do usuário
            await User.updateOne({ _id: originalKool.author }, { $inc: { unreadNotificationsCount: 1 } });

            notificationOccurred = true
          }
        }
      }
    }

    // Upload de mídias, se houver
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const buffer = file.buffer
        // Verifica se o arquivo realmente contém um buffer válido
        if (!buffer) {
          return res.status(400).json({ error: "Nenhuma imagem válida foi enviada." });
        }

        // Criar uma Promise para enviar o buffer para o Cloudinary
        const uploadedImage = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "uploads_1koole"
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          streamifier.createReadStream(buffer).pipe(uploadStream);
        });

        const _media = new Media({
          author: userId,
          url: uploadedImage.secure_url,
          public_id: uploadedImage.public_id,
          secure_url: uploadedImage.secure_url
        });
        await _media.save();
        media.push(_media);
      }
    }

    // Garante que o Kool tenha conteúdo ou mídia antes de salvar
    if (!content && req.files.length === 0) {
      // Retorna erro se não houver conteúdo ou mídia
      return res.status(400).json({ message: "O Kool deve ter texto ou mídia" });
    }

    let tags

    if (!parentKool) {
      // Divide o texto em palavras, remove pontuação e converte para minúsculas
      const words = content.toLowerCase().match(/\b[a-záéíóúãõçü]+\b/gi) || [];

      // Remove palavras comuns irrelevantes (stopwords)
      const stopwords = new Set([
        // Stopwords em português
        'de', 'da', 'do', 'para', 'e', 'o', 'a', 'um', 'uma', 'com', 'por', 'no', 'na',
        'os', 'as', 'na', 'em', 'entre', 'sobre', 'se', 'mas', 'como', 'também', 'ao', 'à',
        'seu', 'sua', 'meu', 'minha', 'nos', 'nas', 'pelos', 'pelas', 'quem', 'que', 'onde',
        'porque', 'como', 'quando', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles',
        'esta', 'estas', 'este', 'estes', 'me', 'te', 'nos', 'vos', 'se', 'ser', 'é', 'não',
        'sim', 'já', 'está', 'estão', 'estava', 'estavam', 'havia', 'haviam', 'vai', 'vai',
        'vão', 'tinha', 'tinham', 'foi', 'foram', 'são', 'ser', 'estava', 'estavam', 'podem',
        'pode', 'poderia', 'poderiam', 'seria', 'seriam', 'haver', 'tem', 'têm', 'fui', 'foram',

        // Stopwords em inglês
        'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'so', 'of', 'to', 'in', 'on', 'at',
        'by', 'with', 'about', 'as', 'for', 'from', 'that', 'this', 'it', 'you', 'he', 'she', 'they',
        'we', 'us', 'i', 'me', 'his', 'her', 'their', 'our', 'my', 'is', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'not', 'just', 'now',
        'all', 'any', 'some', 'many', 'few', 'more', 'most', 'least', 'much', 'less', 'these', 'those',
        'which', 'who', 'whom', 'whose', 'what', 'how', 'why', 'where', 'when'
      ]);

      // Filtra as palavras removendo as stopwords
      const keywords = words.filter(word => !stopwords.has(word));

      // Extraí as hashtags (palavras que começam com # e seguem letras/números)
      const hashtags = content.match(/#([a-zA-Z0-9áéíóúãõçü]+)\b/g) || [];

      // Verifica se as hashtags foram encontradas
      if (hashtags.length > 0) {
        // Filtra as hashtags válidas, removendo o símbolo "#" e deixando apenas letras e números
        const validHashtags = hashtags.map(tag => tag.replace('#', ''))
          .filter(tag => /^[a-zA-Z0-9áéíóúãõçü]+$/.test(tag));

        // Adiciona as hashtags válidas às palavras-chave
        keywords.push(...validHashtags);
      }

      // Junta as palavras-chave e as hashtags
      const allKeywords = [...new Set(keywords)];

      // Limita a 5 palavras-chave/tags
      tags = allKeywords.slice(0, 5);

      // Adiciona o nome e username do usuário às tags
      tags.push(user.name);
      tags.push(user.username);
    }


    // Criação do novo Kool
    const newKool = new Kool({
      author: user._id,
      content,
      media: media.length > 0 ? media.map(m => m._id) : undefined,
      isReply: parentKool && !isReKool ? true : false,
      parentKool: parentKool || undefined, // Define o Kool pai, se houver
      tags: parentKool ? [] : tags, // Define tags, se nao for uma resposta
    });

    await newKool.save(); // Salva o Kool no banco de dados

    // Se for uma resposta, adiciona ao Kool original
    if (parentKool && !isReKool) {
      // Adiciona o ID do novo Kool à lista de respostas do Kool pai
      await Kool.updateOne(
        { _id: parentKool },
        { $addToSet: { replies: newKool._id } }
      );

      // Incrementa o contador de Kools para o usuário
      await user.updateOne({
        $inc: {
          koolsCount: 1
        }
      });
    }

    return res.status(201).json({
      message: parentKool ? "Resposta criada com sucesso" : "Kool criado com sucesso",
      kool: {
        ...newKool.toObject(),
        author: userTransformer(user), // Popula a propriedade 'author' do Kool
        parentKool: originalKool ?? undefined,
        media: media ?? undefined
      },
      notificationOccurred
    });
  } catch (error) {
    // Log do erro para debug
    console.error("Erro ao criar Kool:", error);
    // Retorna erro interno do servidor
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Exporta a função para ser usada nas rotas
module.exports = createKool;