const Kool = require("../../../models/Kool");
const User = require("../../../models/User");
const Media = require("../../../models/Media");
const Notification = require("../../../models/Notification");
const userTransformer = require("../../../utils/userTransformer");

const createKool = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, parentKool, isReKool, media } = req.body; // Media agora vem como array de objetos do frontend
    let notificationOccurred = false;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let originalKool = parentKool ? await Kool.findOne({ _id: parentKool }) : null;

    // Processamento de mídia enviada pelo frontend
    let mediaDocs = [];
    if (media && Array.isArray(media) && media.length > 0) {
      for (const mediaItem of media) {
        // Verificar se é um objeto válido
        if (!mediaItem.public_id || !mediaItem.url || !mediaItem.type) {
          return res.status(400).json({
            success: false,
            error: 'Dados de mídia inválidos'
          });
        }

        // Para vídeos, exigir duração
        if (mediaItem.type === 'video' && !mediaItem.duration) {
          return res.status(400).json({
            success: false,
            error: 'Vídeos devem incluir a duração'
          });
        }

        const mediaDoc = await Media.findOneAndUpdate(
          { public_id: mediaItem.public_id },
          {
            $setOnInsert: { // Só cria se não existir
              public_id: mediaItem.public_id,
              url: mediaItem.url,
              type: mediaItem.type,
              format: mediaItem.format,
              thumbnail: mediaItem.thumbnail || undefined, // Opcional
              width: mediaItem.width || undefined, // Opcional
              height: mediaItem.height || undefined, // Opcional
              duration: mediaItem.duration || undefined, // Obrigatório para vídeos
              author: userId // Usando "author" em vez de "uploaded_by" para manter consistência com o modelo original
            }
          },
          { 
            upsert: true,
            new: true 
          }
        );

        mediaDocs.push(mediaDoc._id);
      }
    }

    if (!content && mediaDocs.length === 0) {
      return res.status(400).json({ message: "O Kool deve ter texto ou mídia" });
    }

    // Geração de tags (mantida como está)
    let tags = [];
    if (!parentKool) {
      const words = content.toLowerCase().match(/\b[a-záéíóúãõçü]+\b/gi) || [];
      const stopwords = new Set([
        "de", "da", "do", "para", "e", "o", "a", "um", "uma", "com", "por", "no", "na",
        "os", "as", "em", "entre", "sobre", "se", "mas", "como", "também", "ao", "à",
        "seu", "sua", "meu", "minha", "nos", "nas", "pelos", "pelas", "quem", "que", "onde",
        "porque", "como", "quando", "esta", "estas", "este", "estes", "me", "te", "nos",
        "vos", "se", "ser", "é", "não", "sim", "já", "está", "estão", "tem", "têm",
      ]);
      const keywords = words.filter((word) => !stopwords.has(word));
      const hashtags = content.match(/#([a-zA-Z0-9áéíóúãõçü]+)\b/g) || [];
      const validHashtags = hashtags
        .map((tag) => tag.replace("#", ""))
        .filter((tag) => /^[a-zA-Z0-9áéíóúãõçü]+$/.test(tag));
      keywords.push(...validHashtags);
      tags = [...new Set(keywords)].slice(0, 5);
      tags.push(user.name, user.username);
    }

    const newKool = new Kool({
      author: user._id,
      content,
      media: mediaDocs.length > 0 ? mediaDocs : undefined,
      isReply: parentKool && !isReKool,
      parentKool: parentKool || undefined,
      tags: parentKool ? [] : tags,
    });

    await newKool.save();

    if (parentKool && !isReKool) {
      await Kool.updateOne({ _id: parentKool }, { $addToSet: { replies: newKool._id } });
      await user.updateOne({ $inc: { koolsCount: 1 } });
    }

    // Populando os dados de mídia para a resposta
    const populatedKool = await Kool.findById(newKool._id).populate('media');

    return res.status(201).json({
      message: parentKool ? "Resposta criada com sucesso" : "Kool criado com sucesso",
      kool: {
        ...populatedKool.toObject(),
        author: userTransformer(user),
        parentKool: originalKool ?? undefined,
      }
    });
  } catch (error) {
    console.error("Erro ao criar Kool:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

module.exports = createKool;