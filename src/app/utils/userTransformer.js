/**
 * Função que transforma o objeto do usuário para exibir apenas as informações públicas
 * @param {Object} user - Objeto do usuário a ser transformado
 * @returns {Object} - Objeto contendo apenas as informações públicas do usuário
 */
const userTransformer = (user) => {
    return {
        _id: user._id,
        profileImage: user.profileImage, // URL do avatar (imagem de perfil)
        coverPhoto: user.coverPhoto, // URL da foto de capa (banner)
        username: user.username, // Nome de usuário
        verified: user.verified,
        name: user.name, // Nome completo
        email: user.email, // E-mail do usuário
        phoneNumber: user.phoneNumber, // Número de telefone (se aplicável)
        birthDate: user.birthDate, // Data de nascimento
        bio: user.bio, // Data de nascimento
        website: user.website,
        followers: user.followers,
        following: user.following,
        unreadNotificationsCount: user.unreadNotificationsCount,
        unreadMessagesCount: user.unreadMessagesCount,
        status: user.status, // Status (ativo/inativo)
        createdAt: user.createdAt, // Data de criação do usuário
        updatedAt: user.updatedAt, // Data da última atualização do usuário
    };
};

module.exports = userTransformer;
