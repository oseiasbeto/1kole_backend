const User = require("../../../models/User");

const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id; // Usuário que será deixado de seguir
        const followingId = req.params.id; // Usuário que está dando unfollow

        // Verifica se o usuário está tentando deixar de seguir a si mesmo
        if (followerId === followingId) {
            return res.status(400).json({ message: "Você não pode deixar de seguir a si mesmo." });
        }

        // Busca os usuários no banco de dados
        const follower = await User.findById(followerId);
        const following = await User.findById(followingId);

        // Verifica se os usuários existem
        if (!follower || !following) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // Verifica se o usuário realmente segue o outro
        if (!follower.following.includes(followingId)) {
            return res.status(400).json({ message: "Você não está seguindo este usuário." });
        }

        // Remove o usuário da lista de "seguindo" do seguidor
        await follower.updateOne({
            $pull: {
                following: followingId
            }
        })

        // Remove o seguidor da lista de "seguidores" do usuário seguido
        await following.updateOne({
            $pull: {
                followers: followerId
            }
        })
        
        // Retorna a resposta de sucesso
        return res.status(200).json({ message: "Você deixou de seguir este usuário." });

    } catch (error) {
        console.error("Erro ao deixar de seguir usuário:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

module.exports = unfollowUser;
