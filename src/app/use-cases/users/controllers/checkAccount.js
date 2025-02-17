const moment = require('moment'); // Importa a biblioteca Moment.js para manipulação de datas
const User = require('../../../models/User'); // Importa o modelo User para consultar o banco de dados

const checkAccount = async (req, res) => {
    try {
        // Obtém o token enviado no corpo da requisição
        const { token } = req.body;

        // Se o token não for fornecido, retorna um erro informando que ele é obrigatório
        if (!token) {
            return res.status(400).json({ message: "O token é obrigatório." });
        }

        // Busca um usuário no banco de dados que possua o token fornecido
        const user = await User.findOne({ verificationToken: token });

        // Se nenhum usuário for encontrado com esse token, retorna um erro
        if (!user) {
            return res.status(400).json({ message: "Token inválido ou usuário não encontrado." });
        }

        // Verifica se o token de verificação já expirou
        if (user.verificationTokenExpires && moment().isAfter(user.verificationTokenExpires)) {
            return res.status(400).json({ message: "O token expirou. Solicite um novo código de verificação." });
        }

        // Se o token for válido, ativa a conta do usuário
        user.status = 'active'; // Define o status do usuário como ativo
        user.verificationToken = null; // Remove o token de verificação, pois não é mais necessário
        user.verificationTokenExpires = null; // Remove a data de expiração do token
        await user.save(); // Salva as alterações no banco de dados

        // Retorna uma resposta informando que a conta foi verificada com sucesso
        return res.status(200).json({ message: "Conta verificada com sucesso." });

    } catch (error) {
        // Captura qualquer erro inesperado e retorna uma mensagem genérica de erro
        return res.status(500).json({ message: "Erro ao verificar e-mail.", error: error.message });
    }
};

// Exporta o controller para ser utilizado em outras partes do código
module.exports = checkAccount;
