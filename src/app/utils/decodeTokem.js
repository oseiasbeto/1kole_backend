// Importando a função 'verify' da biblioteca 'jsonwebtoken' para verificar e decodificar o token.
const { verify } = require("jsonwebtoken");

/**
 * Função para decodificar um token JWT utilizando uma chave secreta.
 * 
 * @param {string} token - O token JWT a ser verificado e decodificado.
 * @param {string} secreetKey - A chave secreta usada para verificar a assinatura do token.
 * 
 * @returns {object} - O payload decodificado do token, se for válido.
 * @throws {Error} - Lança um erro se o token for inválido ou não puder ser verificado.
 */
const decodeTokem = (token, secreetKey) => {
    try {
        // Verifica e decodifica o token utilizando a chave secreta fornecida
        const decoded = verify(token, secreetKey);
        return decoded; // Retorna o payload decodificado do token
    } catch (error) {
        // Lança um erro com uma mensagem mais detalhada em caso de falha na verificação do token
        throw new Error('Falha ao verificar o token. O token pode estar expirado ou com a assinatura inválida.');
    }
}

// Exporta a função para que possa ser utilizada em outras partes da aplicação
module.exports = decodeTokem;
