const Kool = require("../../../models/Kool");
const Media = require("../../../models/Media");
const cloudinary = require("../../../config/cloudinary");

const deleteKool = async (req, res) => {
  try {
    const { id } = req.params;
    const kool = await Kool.findOne({ _id: id });

    if (!kool) {
      return res.status(404).json({ message: "Kool not found" });
    }

    // Se o post tiver mídias vinculadas, remover cada uma do Cloudinary e da coleção Media
    if (kool.media && kool.media.length > 0) {
      for (const mediaId of kool.media) {
        // Buscar a mídia na coleção Media
        const mediaDoc = await Media.findById(mediaId);
        if (mediaDoc) {
          console.log(`Tentando deletar mídia com public_id: ${mediaDoc.public_id}, tipo: ${mediaDoc.type}`);
          
          // Determinar o resource_type com base no tipo de mídia
          const resourceType = mediaDoc.type === "video" ? "video" : "uploads_1koole";

          // Remover o arquivo do Cloudinary usando o public_id
          try {
            const result = await cloudinary.uploader.destroy(mediaDoc.public_id, {
              resource_type: resourceType,
            });
            console.log(`Resultado do Cloudinary para ${mediaDoc.public_id}:`, result);

            if (result.result !== "ok") {
              console.error(`Falha ao deletar ${mediaDoc.public_id} do Cloudinary: ${result.result}`);
            }
          } catch (cloudinaryError) {
            console.error(`Erro ao tentar deletar ${mediaDoc.public_id} do Cloudinary:`, cloudinaryError);
            // Não interrompemos o processo, apenas logamos o erro
          }

          // Remover a mídia da coleção Media
          await mediaDoc.deleteOne();
          console.log(`Mídia ${mediaId} removida da coleção Media`);
        } else {
          console.warn(`Mídia com ID ${mediaId} não encontrada na coleção Media`);
        }
      }
    }

    // Atualizar documentos que referenciam este Kool como reply
    await Kool.updateMany({ replies: kool._id }, { $pull: { replies: kool._id } });
    console.log(`Referências ao Kool ${id} removidas de replies`);

    // Deletar o próprio Kool
    await kool.deleteOne();
    console.log(`Kool ${id} deletado com sucesso`);

    res.status(200).json({ message: "Kool deleted successfully" });
  } catch (err) {
    console.error("Erro ao deletar Kool:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = deleteKool;