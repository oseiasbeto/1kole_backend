const User = require('../../../models/User'); // Importa o modelo User para interagir com o banco de dados

const checkEmailExists = async (req, res) => { // Define a função assíncrona checkEmailExists para verificar se um e-mail já está cadastrado
    try {
        const { email } = req.params; // Obtém o e-mail dos parâmetros da requisição (URL)
        
        if (!email) { // Verifica se o e-mail foi fornecido
            return res.status(400).json({ message: "O e-mail é obrigatório." }); // Retorna erro 400 se o e-mail estiver ausente
        }

        const user = await User.findOne({ email }); // Busca um usuário no banco de dados com o e-mail fornecido

        if (user) { // Se um usuário for encontrado com o mesmo e-mail
            return res.status(409).json({ message: "Este e-mail já está em uso." }); // Retorna erro 409 indicando conflito (e-mail já cadastrado)
        }

        return res.status(200).json({ message: "E-mail disponível." }); // Retorna status 200 confirmando que o e-mail está disponível
    } catch (error) { // Captura erros durante a execução da função
        return res.status(500).json({ message: "Erro ao verificar e-mail.", error: error.message }); // Retorna erro 500 em caso de falha no servidor
    }
};

module.exports = checkEmailExists; // Exporta a função para ser utilizada em outras partes do sistema
