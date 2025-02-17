const User = require("../../../models/User");
const Notification = require("../../../models/Notification");

const followUser = async (req, res) => {
    try {
        const followerId = req.user.id; // ID do usuário que está fazendo a requisição (seguindo)
        const followingId = req.params.id; // ID do usuário que será seguido

        // Verifica se o seguidor e o seguido são diferentes
        if (followerId === followingId) {
            return res.status(400).json({ message: "Você não pode seguir a si mesmo." });
        }

        // Encontra os dois usuários (seguidor e seguido)
        const follower = await User.findById(followerId);
        const following = await User.findById(followingId);

        // Verifica se ambos os usuários existem
        if (!follower || !following) {
            return res.status(404).json({ message: "Algo deu errado." });
        }

        // Verifica se o seguidor já está seguindo o usuário
        if (follower.following.includes(followingId)) {
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
            return res.status(200).json({ message: "Deixaste de seguir este perfil" });
        }

        // Adiciona o usuário à lista de "seguindo" do seguidor
        follower.following.push(followingId);

        // Adiciona o seguidor à lista de "seguidores" do usuário seguido
        following.followers.push(followerId);

        // Salva as alterações em ambos os usuários
        await follower.save();
        await following.save();

        // Calcular a data limite para considerar as notificações recentes (últimas 24 horas)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Verifica se já existe uma notificação do tipo "follow" e não lida para o usuário seguido
        let existingNotification = await Notification.findOne({
            user: followingId, // O usuário que está recebendo a notificação
            type: "follow", // Tipo de notificação
            isRead: false, // A notificação não foi lida
            createdAt: { $gte: twentyFourHoursAgo } // A notificação deve ser recente (últimas 24h)
        });

        if (existingNotification) {
            // Busca os usuários que já estão na notificação
            let usersList = await User.find({ _id: { $in: existingNotification.relatedUsers } });

            // Verifica se o usuário já está na notificação
            if (!usersList.some(u => u._id.toString() === followerId)) {
                // Adiciona o novo seguidor à lista de usuários relacionados
                const newUser = await User.findById(followerId);

                if (newUser) {
                    usersList.push(newUser);

                    // Extrai os nomes dos usuários
                    const usersListNames = usersList.map(u => u.name);

                    // Define a mensagem conforme o número de usuários
                    let notificationMessage;
                    if (usersList.length === 1) {
                        notificationMessage = `${usersListNames[0]} começou a te seguir!`;
                    } else {
                        const maxUsers = 2;
                        const remainingUsers = usersList.length - maxUsers;
                        notificationMessage = `${usersListNames.slice(0, maxUsers).join(', ')}${remainingUsers > 0 ? ` e mais ${remainingUsers} ${remainingUsers === 1 ? 'pessoa' : 'pessoas'} começaram` : ' começaram'} a te seguir!`;
                    }

                    await Notification.updateOne(
                        { _id: existingNotification._id },
                        {
                            $set: { message: notificationMessage },
                            $addToSet: { relatedUsers: followerId },
                        }
                    );

                    // Incrementa o contador de notificações não lidas do usuário
                    await User.updateOne({ _id: followingId }, { $inc: { unreadNotificationsCount: 1 } });
                }
            }
        } else {
            // Cria a notificação se o seguidor ainda não segue
            const user = await User.findById(followerId);
            if (user) {
                const notificationMessage = `${user.name} começou a te seguir!`;
                const notification = new Notification({
                    user: followingId,
                    type: 'follow',
                    message: notificationMessage,
                    relatedUsers: [followerId],
                });
                await notification.save();

                // Incrementa o contador de notificações não lidas do usuário
                await User.updateOne({ _id: followingId }, { $inc: { unreadNotificationsCount: 1 } });
            }
        }

        // Incrementando a quantidade total de notificações não lidas
        await following.updateOne({
            $inc: {
                unreadNotificationsCount: + 1
            }
        })

        // Responde com sucesso
        res.status(200).json({ message: "Agora você segue este usuário." });
    } catch (error) {
        console.error("Erro ao seguir usuário:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

module.exports = followUser;
