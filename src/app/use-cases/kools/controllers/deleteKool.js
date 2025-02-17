const Kool = require("../../../models/Kool");
const Media = require("../../../models/Media");
const cloudinary = require("../../../config/cloudinary"); // Caso tenha upload de mídia

const deleteKool = async (req, res) => {
  try {
    const { id } = req.params;
    const kool = await Kool.findOne({
      _id: id
    });

    if (!kool) {
      return res.status(404).json({ message: "Kool not found" });
    }

    /* 
    // 🚀 Função Recursiva para Deletar Replies
    const deleteRepliesRecursively = async (parentId) => {
      const replies = await Kool.find({ parentKool: parentId });

      for (const reply of replies) {
        await deleteRepliesRecursively(reply._id); // Chama recursivamente
        await Kool.findByIdAndDelete(reply._id);
      }
    };

    // 1. Deleta todas as replies associadas ao Kool
    await deleteRepliesRecursively(koolId);

    // 2. Remove o Kool pai de qualquer `reKools` (caso tenha sido compartilhado)
    await Kool.updateMany({ reKools: koolId }, { $pull: { reKools: koolId } });
    */



    // Se o post tiver mídias vinculadas, remover cada uma do Cloudinary e da coleção Media
    if (kool.media && kool.media.length > 0) {
      for (const mediaId of kool.media) {
        // Buscar a mídia na coleção Media
        const mediaDoc = await Media.findById(mediaId);
        if (mediaDoc) {
          // Remover o arquivo do Cloudinary usando o public_id
          await cloudinary.uploader.destroy(mediaDoc.public_id);
          // Remover a mídia da coleção (opcional, se deseja manter a integridade do BD)
          await mediaDoc.deleteOne();
        }
      }
    }

    await Kool.updateMany({ replies: kool._id }, { $pull: { replies: kool._id } });

    // 4. Deletar o próprio Kool
    await kool.deleteOne();

    res.status(200).json({ message: "Kool deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = deleteKool;
