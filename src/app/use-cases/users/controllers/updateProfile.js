const userTransformer = require("../../../utils/userTransformer");
const User = require("../../../models/User");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

/**
 * Middleware para atualizar o perfil do usuário, incluindo a remoção da imagem antiga do Cloudinary.
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Obtém o ID do usuário autenticado
        const { name, bio, birthDate, website } = req.body; // Obtém os dados do corpo da requisição

        const profileImage = req.files?.profileImage; // Arquivo da nova foto de perfil (se houver)
        const coverPhoto = req.files?.coverPhoto; // Arquivo da nova foto de capa (se houver)

        // Encontra o usuário no banco de dados
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }


        if (profileImage) {
            const buffer = profileImage[0].buffer
            // Verifica se o arquivo realmente contém um buffer válido
            if (!buffer) {
                return res.status(400).json({ error: "Nenhuma imagem válida foi enviada." });
            }

            // Criar uma Promise para enviar o buffer para o Cloudinary
            const uploadedImage = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "uploads_1koole",
                        transformation: [{ width: 500, height: 500, crop: "limit" }],
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                streamifier.createReadStream(buffer).pipe(uploadStream);
            });

            user.profileImage = {
                url: uploadedImage.secure_url,
                public_id: uploadedImage.public_id
            }
            console.log(uploadedImage)
        }
        if (coverPhoto) {
            const buffer = coverPhoto[0].buffer
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

            user.coverPhoto = {
                url: uploadedImage.secure_url,
                public_id: uploadedImage.public_id
            }
            console.log(uploadedImage)
        }
        
        // Atualiza os dados do perfil (nome e bio)
        if (name) user.name = name;
        if (bio) user.bio = bio;
        if (birthDate) user.birthDate = birthDate;
        if (website) user.website = website;

        // Salva as alterações no banco de dados
        await user.save();

        return res.status(200).json({
            message: "Perfil atualizado com sucesso!",
            user: userTransformer(user)
        });
    }
    catch (error) {
        console.error("Erro ao atualizar o perfil:", error);
        return res.status(500).json({ message: "Erro interno no servidor." });
    }
};

module.exports = updateProfile;
