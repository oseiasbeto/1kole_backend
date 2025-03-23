// Importa a função 'sign' do módulo 'jsonwebtoken', que é usada para gerar tokens JWT
const { sign } = require("jsonwebtoken");

/**
 * Função para gerar um token de acesso (Access Token) para um usuário.
 * 
 * @param {object} user - Objeto representando o usuário. Deve conter pelo menos os campos '_id', 'email' e 'username'.
 * @param {string} expiresIn - Tempo de expiração do token, que pode ser uma string representando o tempo (ex: '1h', '2d').
 * 
 * @returns {string} - O token de acesso gerado.
 */
const generateAccessToken = (user, expiresIn) => {
    // Obtém a chave secreta do arquivo de variáveis de ambiente (normalmente configurada no arquivo .env)
    const secreetKey = process.env.JWT_ACCESS_TOKEN_SECRET;

    // Cria o token de acesso usando a função 'sign' do 'jsonwebtoken'
    // Passa o payload (dados do usuário), a chave secreta e o tempo de expiração do token
    const accessToken = sign({
        id: user._id,           // ID do usuário, usado para identificar o usuário no token
        email: user.email,      // E-mail do usuário, incluído para fins de autenticação
        username: user.username // Nome de usuário, incluído como informação adicional
    }, secreetKey, {             // A chave secreta para assinar o token
        expiresIn: expiresIn    // Define o tempo de expiração do token
    });

    // Retorna o token gerado
    return accessToken;
};

// Exporta a função para que possa ser utilizada em outras partes da aplicação
module.exports = generateAccessToken;
