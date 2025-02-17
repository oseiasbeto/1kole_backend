// Importa o modelo User para interagir com o banco de dados
const User = require('../../../models/User');

// Importa a biblioteca moment para manipulação de datas
const moment = require('moment');

// Importa o bcrypt para criptografar a nova senha
const bcrypt = require('bcryptjs');

// Define a função assíncrona resetPassword para redefinir a senha do usuário
const resetPassword = async (req, res) => {
    try {
        // Extrai o token e a nova senha do corpo da requisição
        const { token, newPassword } = req.body;
        
        // Verifica se ambos os campos foram fornecidos
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token e nova senha são obrigatórios." });
        }

        console.log( token, newPassword)

        // Busca um usuário no banco de dados com o token fornecido
        const user = await User.findOne({ resetPasswordToken: token });
        
        // Verifica se o usuário existe e se o token é válido
        if (!user) {
            return res.status(400).json({ message: "Token inválido ou expirado." });
        }

        // Obtém a data e hora atual
        const now = moment();
        // Converte a data de expiração do token para um objeto moment
        const expirationTime = moment(user.resetPasswordExpires);
        
        // Verifica se o token já expirou
        if (now.isAfter(expirationTime)) {
            return res.status(400).json({ message: "O token de redefinição de senha expirou." });
        }

        // Gera um salt para a criptografia da nova senha
        const salt = await bcrypt.genSalt(10);
        // Criptografa a nova senha do usuário
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Atualiza a senha do usuário no banco de dados
        user.password = hashedPassword;
        // Remove o token de redefinição de senha, pois já foi utilizado
        user.resetPasswordToken = null;
        // Remove a data de expiração do token
        user.resetPasswordExpires = null;
        
        // Salva as alterações no banco de dados
        await user.save();

        // Retorna uma resposta de sucesso
        return res.status(200).json({ user, message: "Senha redefinida com sucesso." });
    } catch (error) {
        // Captura erros e retorna uma resposta de erro interno do servidor
        return res.status(500).json({ message: "Erro ao redefinir a senha", error: error.message });
    }
};

// Exporta a função para ser utilizada em outras partes do sistema
module.exports = resetPassword;
