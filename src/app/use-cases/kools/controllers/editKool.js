const Kool = require("../../../models/Kool");

const editKool = async (req, res) => {
    try {
        const userId = req.user.id; // ID do usuário autenticado
        const { koolId } = req.params // ID do kool
        const { content, media } = req.body;

        // Verifica se o Kool existe
        const kool = await Kool.findById(koolId);
        if (!kool) {
            return res.status(404).json({ message: "Kool não encontrado." });
        }

        // Verifica se o usuário que está editando é o autor do Kool
        if (kool.author.toString() !== userId) {
            return res.status(403).json({ message: "Você não tem permissão para editar este Kool." });
        }

        // Verifica se há mídias novas para atualizar
        let mediaFiles = kool.media;
        if (media && media.length > 0) {
            // Remove mídias antigas do Cloudinary, se necessário
            if (kool.media && kool.media.length > 0) {
                for (const file of kool.media) {
                    if (file.public_id) {
                        await cloudinary.uploader.destroy(file.public_id); // Remove do Cloudinary
                    }
                }
            }

            // Faz o upload das novas mídias para o Cloudinary
            mediaFiles = [];
            for (const file of media) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: "kools",
                    resource_type: "auto",
                });
                mediaFiles.push({ public_id: result.public_id, url: result.secure_url });
            }
        }

        // Atualiza o conteúdo e as mídias do Kool
        kool.content = content || kool.content; // Mantém o conteúdo atual se nenhum novo for fornecido
        kool.media = mediaFiles.length > 0 ? mediaFiles : kool.media;

        // Salva as alterações
        await kool.save();

        return res.status(200).json({ message: "Kool atualizado com sucesso.", kool });
    } catch (error) {
        console.error("Erro ao editar Kool:", error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
};

module.exports = editKool;
