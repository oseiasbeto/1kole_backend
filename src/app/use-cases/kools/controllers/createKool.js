const Kool = require("../../../models/Kool");
const User = require("../../../models/User");
const Media = require("../../../models/Media");
const Notification = require("../../../models/Notification");
const userTransformer = require("../../../utils/userTransformer");
const cloudinary = require("../../../config/cloudinary");
const streamifier = require("streamifier");

const createKool = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, parentKool, isReKool } = req.body;
    let media = [];
    let notificationOccurred = false;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let originalKool = parentKool ? await Kool.findOne({ _id: parentKool }) : null;

    // Lógica para ReKool (mantida como está)
    if (isReKool) {
      if (!parentKool) {
        return res.status(400).json({ message: "O ReKool deve referenciar um Kool original" });
      }
      if (!originalKool) {
        return res.status(404).json({ message: "Kool original não encontrado" });
      }

      const existingReKool = await Kool.findOne({
        parentKool,
        author: userId,
        isReKool: true,
      });

      if (existingReKool) {
        await existingReKool.deleteOne();
        await originalKool.updateOne({ $pull: { reKools: userId } });
        return res.status(200).json({ message: "ReKool removido com sucesso!" });
      }

      const reKool = new Kool({
        author: userId,
        parentKool,
        isReKool: true,
      });
      await reKool.save();
      await originalKool.updateOne({ $addToSet: { reKools: userId } });

      const existingReKoolNotification = await Notification.findOne({
        user: originalKool.author,
        type: "rekool",
        relatedKool: originalKool._id,
        relatedUsers: { $nin: [userId] },
        isRead: false,
      });

      if (existingReKoolNotification) {
        let usersList = await User.find({ _id: { $in: existingReKoolNotification.relatedUsers } });
        if (!usersList.some((u) => u._id.toString() === userId)) {
          const newUser = await User.findById(userId);
          if (newUser && newUser._id.toString() !== originalKool.author.toString()) {
            usersList.push(newUser);
            const usersListNames = usersList.map((u) => u.name);
            let notificationMessage =
              usersList.length === 1
                ? `${usersListNames[0]} fez um ReKool no seu Kool!`
                : `${usersListNames.slice(0, 2).join(", ")}${usersList.length > 2 ? ` e mais ${usersList.length - 2} pessoas fizeram ReKool` : " fizeram ReKool"} no seu Kool!`;
            await Notification.updateOne(
              { _id: existingReKoolNotification._id },
              { $set: { message: notificationMessage }, $addToSet: { relatedUsers: userId } }
            );
          }
        }
      } else if (originalKool.author.toString() !== userId) {
        const user = await User.findById(userId);
        if (user) {
          const notification = new Notification({
            user: originalKool.author,
            type: "rekool",
            message: `${user.name} fez um ReKool do seu Kool!`,
            relatedUsers: [userId],
            relatedKool: originalKool._id,
          });
          await notification.save();
          await User.updateOne({ _id: originalKool.author }, { $inc: { rekoolsCount: 1 } });
          notificationOccurred = true;
        }
      }

      return res.status(201).json({ message: "ReKool realizado com sucesso", kool: reKool, notificationOccurred });
    }

    // Lógica para Reply (mantida como está)
    if (parentKool) {
      if (!originalKool) {
        return res.status(404).json({ message: "Kool original não encontrado" });
      }

      const existingReplyNotification = await Notification.findOne({
        user: originalKool.author,
        type: "reply",
        relatedKool: originalKool._id,
        isRead: false,
      });

      if (existingReplyNotification) {
        let usersList = await User.find({ _id: { $in: existingReplyNotification.relatedUsers } });
        if (!usersList.some((u) => u._id.toString() === userId)) {
          const newUser = await User.findById(userId);
          if (newUser && newUser._id.toString() !== originalKool.author.toString()) {
            usersList.push(newUser);
            const usersListNames = usersList.map((u) => u.name);
            let notificationMessage =
              usersList.length === 1
                ? `${usersListNames[0]} respondeu ao seu Kool!`
                : `${usersListNames.slice(0, 2).join(", ")}${usersList.length > 2 ? ` e mais ${usersList.length - 2} pessoas responderam` : " responderam"} ao seu Kool!`;
            await Notification.updateOne(
              { _id: existingReplyNotification._id },
              { $set: { message: notificationMessage }, $addToSet: { relatedUsers: userId } }
            );
          }
        }
      } else if (originalKool.author.toString() !== userId) {
        const user = await User.findById(userId);
        if (user) {
          const notification = new Notification({
            user: originalKool.author,
            type: "reply",
            message: `${user.name} respondeu ao seu Kool!`,
            relatedUsers: [userId],
            relatedKool: originalKool._id,
          });
          await notification.save();
          await User.updateOne({ _id: originalKool.author }, { $inc: { unreadNotificationsCount: 1 } });
          notificationOccurred = true;
        }
      }
    }

    // Upload de mídias (ajustado para incluir duration)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const buffer = file.buffer;
        if (!buffer) {
          return res.status(400).json({ message: "Nenhum arquivo válido foi enviado." });
        }

        const isVideo = file.mimetype.startsWith("video/");
        const uploadOptions = isVideo
          ? {
              resource_type: "video",
              folder: "videos",
              eager: [{ format: "m3u8", streaming_profile: "hd" }], // Gera HLS
            }
          : {
              resource_type: "image",
              folder: "uploads_1koole",
            };

        const uploadedMedia = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          streamifier.createReadStream(buffer).pipe(uploadStream);
        });

        let mediaDoc;
        if (isVideo) {
          // Pegando a URL HLS
          const hlsUrl = uploadedMedia.eager?.[0]?.secure_url;
          if (!hlsUrl) {
            throw new Error("Falha ao processar o vídeo em HLS.");
          }

          // Gerando a URL da thumbnail
          const thumbnailUrl = cloudinary.url(uploadedMedia.public_id, {
            resource_type: "video",
            transformation: [
              { width: uploadedMedia.width, crop: "scale" },
              { quality: "80" },
              { fetch_format: "auto" },
              { dpr: "auto" },
              { start_offset: "1" },
            ],
            secure: true,
          });

          // Extraindo a duração do resultado do Cloudinary
          const duration = uploadedMedia.duration; // Em segundos (ex.: 120.5)

          mediaDoc = new Media({
            author: userId,
            url: hlsUrl, // URL HLS para o vídeo
            public_id: uploadedMedia.public_id,
            type: "video",
            size: uploadedMedia.bytes || file.size,
            width: uploadedMedia.width,
            height: uploadedMedia.height,
            thumbnail: thumbnailUrl,
            duration: duration, // Adicionando a duração
          });
        } else {
          mediaDoc = new Media({
            author: userId,
            url: uploadedMedia.secure_url,
            public_id: uploadedMedia.public_id,
            type: "image",
            size: uploadedMedia.bytes || file.size,
            width: uploadedMedia.width,
            height: uploadedMedia.height,
          });
        }

        await mediaDoc.save();
        media.push(mediaDoc);
      }
    }

    if (!content && (!req.files || req.files.length === 0)) {
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
      media: media.length > 0 ? media.map((m) => m._id) : undefined,
      isReply: parentKool && !isReKool,
      parentKool: parentKool || undefined,
      tags: parentKool ? [] : tags,
    });

    await newKool.save();

    if (parentKool && !isReKool) {
      await Kool.updateOne({ _id: parentKool }, { $addToSet: { replies: newKool._id } });
      await user.updateOne({ $inc: { koolsCount: 1 } });
    }

    return res.status(201).json({
      message: parentKool ? "Resposta criada com sucesso" : "Kool criado com sucesso",
      kool: {
        ...newKool.toObject(),
        author: userTransformer(user),
        parentKool: originalKool ?? undefined,
        media: media.length > 0 ? media : undefined,
      },
      notificationOccurred,
    });
  } catch (error) {
    console.error("Erro ao criar Kool:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

module.exports = createKool;