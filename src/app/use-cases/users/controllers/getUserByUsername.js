const userTransformer = require('../../../utils/userTransformer');
const User = require('../../../models/User'); // Supondo que o modelo de User está em ../models/User

// Função para buscar usuário por username
const getUserByUsername = async (req, res) => {
  const { username } = req.params; // Extrai o username da URL

  try {
    // Tenta encontrar o usuário pelo username
    const user = await User.findOne({ username })

    // Se o usuário não for encontrado, retorna erro
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Se encontrado, retorna o usuário
    return res.status(200).json({
        user: userTransformer(user),
        message: "Usuário encontrado com sucesso!"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};

module.exports = getUserByUsername;
