// Importa a função 'createDecipheriv' do módulo 'crypto' para criar um decifrador de dados criptografados.
const { createDecipheriv } = require("crypto");

/**
 * Função para descriptografar um token de refresh.
 * 
 * @param {object} data - Objeto contendo os dados necessários para descriptografar o token.
 * @param {string} data.encryptedRefreshToken - O token de refresh criptografado que será decifrado.
 * @param {string} data.key - A chave usada para a descriptografia (em formato hexadecimal).
 * @param {string} data.iv - O vetor de inicialização (IV) usado na descriptografia (em formato hexadecimal).
 * 
 * @returns {string} - O token de refresh descriptografado.
 * @throws {Error} - Lança um erro caso a descriptografia falhe.
 */
const decryptRefreshToken = (data) => {
    // Define o algoritmo de criptografia utilizado (AES-256-CBC)
    const algorithm = "aes-256-cbc";
    const token = data.encryptedRefreshToken; // Token criptografado

    // Recupera a chave e o IV (vetor de inicialização) do objeto 'data'
    const key = data.key;
    const iv = data.iv;

    // Cria o decifrador usando o algoritmo, a chave e o IV
    const decipher = createDecipheriv(algorithm, Buffer.from(key, "hex"), Buffer.from(iv, "hex"));

    // Descriptografa o token
    let decipherUpdate = decipher.update(Buffer.from(token, "hex"));

    // Junta as partes descriptografadas e converte para string
    const decryptedRefreshToken = Buffer.concat([decipherUpdate, decipher.final()]).toString();

    // Se a descriptografia for bem-sucedida, retorna o token descriptografado
    if (decryptedRefreshToken) {
        return decryptedRefreshToken;
    } else {
        // Lança um erro com uma mensagem mais informativa caso algo dê errado
        throw new Error("Erro ao descriptografar o token. A chave ou o IV podem estar incorretos.");
    }
}

// Exporta a função para que possa ser utilizada em outras partes da aplicação
module.exports = decryptRefreshToken;
