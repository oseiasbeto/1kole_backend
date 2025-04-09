const User = require('../../../models/User'); // Importa o modelo de User para interagir com o banco de dados
const moment = require('moment'); // Importa o Moment.js para manipulação de datas e horários
const { randomUUID } = require("crypto");
const sendMail = require('../../../mail/sendMail');


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body; // Obtém o e-mail do corpo da requisição
        if (!email) {
            return res.status(400).json({ message: "O e-mail é obrigatório." }); // Retorna erro se o e-mail não for fornecido
        }
        const user = await User.findOne({ email }); // Busca o usuário pelo e-mail
        if (!user) {
            return res.status(400).json({ message: "Usuário não encontrado." }); // Retorna erro se o usuário não for encontrado
        }

        // Verifica se já existe um token ativo para redefinição de senha
        if (user.resetPasswordToken && user.resetPasswordExpires) {
            const now = moment(); // Obtém o momento atual

            const expirationTime = moment(user.resetPasswordExpires); // Obtém a data de expiração do token

            if (now.isBefore(expirationTime)) { // Se o token ainda estiver válido, retorna erro
                return res.status(400).json({ message: "Já existe um pedido de redefinição de senha pendente. Aguarde até a expiração." });
            }
        }

        // Gerar e salvar um novo token de redefinição de senha
        const token = randomUUID(); // Gera um token aleatório
        user.resetPasswordToken = token; // Armazena o token no banco de dados
        user.resetPasswordExpires = moment().add(1, 'hour').toDate(); // Define a expiração do token para 1 hora
        await user.save(); // Salva as alterações no banco de dados

        // Aqui você pode adicionar o envio do e-mail com o token

        const title = "Redefinição de senha";
        const message = "Clique no link abaixo para redefinir sua senha na 1kole:";
        const resetLink = `${process.env.CLIENT_URL}reset_password?token=${token}`;

        await sendMail(user.email, "reset_password", title, { resetLink:resetLink, title, message });

        return res.status(200).json({ message: "Um link de redefinição de senha foi enviado para o seu e-mail." }); // Retorna sucesso
    } catch (error) {
        return res.status(500).json({ message: "Erro ao recuperar a senha", error: error.message }); // Retorna erro em caso de falha
    }
};

module.exports = forgotPassword; // Exporta a função para uso em outras partes do código
