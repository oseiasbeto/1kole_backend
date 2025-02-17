// Importa as funções 'randomBytes' e 'createCipheriv' do módulo 'crypto' para gerar chave aleatória e criptografar dados
const { randomBytes, createCipheriv } = require("crypto");

/**
 * Função para criptografar um token de refresh.
 * 
 * @param {string} refreshToken - O token de refresh que será criptografado.
 * 
 * @returns {object} - Objeto contendo a chave (key), vetor de inicialização (iv) e o token criptografado.
 * @throws {Error} - Lança um erro caso ocorra alguma falha no processo de criptografia.
 */
const encryptRefreshToken = (refreshToken) => {
    // Define o algoritmo de criptografia utilizado (AES-256-CBC)
    const algorithm = "aes-256-cbc";

    // Gera uma chave aleatória de 32 bytes (256 bits) e converte para hexadecimal
    const key = randomBytes(32).toString("hex");

    // Gera um vetor de inicialização (IV) aleatório de 16 bytes e converte para hexadecimal
    const iv = randomBytes(16).toString("hex");

    try {
        // Cria o cifrador usando o algoritmo, a chave e o IV
        let cipher = createCipheriv(algorithm, Buffer.from(key, "hex"), Buffer.from(iv, "hex"));

        // Criptografa o token de refresh
        let updateCipher = cipher.update(refreshToken);

        // Finaliza a criptografia e junta as partes
        let token = Buffer.concat([updateCipher, cipher.final()]).toString("hex");

        // Retorna o objeto com a chave, o vetor de inicialização e o token criptografado
        return {
            key,
            iv,
            token
        };
    } catch (error) {
        // Lança um erro com uma mensagem detalhada caso algo dê errado no processo de criptografia
        throw new Error("Erro ao criptografar o refresh token. Verifique se o algoritmo e os parâmetros estão corretos.");
    }
};

// Exporta a função para que possa ser utilizada em outras partes da aplicação
module.exports = encryptRefreshToken;
