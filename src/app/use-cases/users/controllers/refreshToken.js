const User = require("../../../models/User") // Importa o modelo de usuário para interagir com o banco de dados
const generateAccessToken = require("../../../utils/generateAccessToken") // Função para gerar um novo token de acesso (JWT)
const generateRefreshToken = require("../../../utils/generateRefreshToken") // Função para gerar um novo token de atualização (refresh token)
const decryptRefreshToken = require("../../../utils/decryptRefreshToken") // Função para descriptografar o token de atualização armazenado
const decodeTokem = require("../../../utils/decodeTokem") // Função para decodificar um token JWT
const encryptRefreshToken = require("../../../utils/encryptRefreshToken") // Função para criptografar o token de atualização antes de armazená-lo
const userTransformer = require("../../../utils/userTransformer") // Função para formatar a resposta do usuário

const moment = require("moment")
const Session = require("../../../models/Session") // Importa o modelo de sessão para verificar sessões ativas

/**
 * Função para atualizar o token de acesso a partir de um refresh token válido.
 * @param {Object} req - Objeto da requisição HTTP
 * @param {Object} res - Objeto da resposta HTTP
 */
const refreshToken = async (req, res) => {
    try {
        const { sessionId } = req.body // Obtém o ID da sessão do corpo da requisição

        // Verifica se o sessionId foi informado corretamente
        if (sessionId == '' || sessionId == undefined) {
            return res.status(400).send({
                message: "Informe o id da sessão." // Retorna erro se o ID da sessão estiver vazio ou indefinido
            })
        } else {
            // Busca a sessão ativa correspondente ao sessionId informado
            const session = await Session.findOne({
                id: sessionId,
                status: 'active' // A sessão precisa estar ativa
            })

            // Se a sessão não for encontrada, retorna erro 401 (não autorizado)
            if (!session) return res.status(401).send({
                message: "Ups! não achamos nenhuma sessão com este ID."
            })
            else {
                const key = session.crypto.key // Obtém a chave de criptografia da sessão
                const iv = session.crypto.iv // Obtém o IV (vetor de inicialização) da sessão

                const encryptedRefreshToken = session.token // Obtém o token de atualização criptografado da sessão
                const secreetRefreshTokenKey = process.env.JWT_REFRESH_TOKEN_SECRET // Obtém a chave secreta do refresh token do ambiente

                // Descriptografa o refresh token armazenado na sessão
                const decryptToken = decryptRefreshToken({
                    key: key,
                    iv,
                    encryptedRefreshToken: encryptedRefreshToken
                })

                // Decodifica os dados contidos no refresh token
                const decodedData = decodeTokem(decryptToken, secreetRefreshTokenKey)

                // Busca o usuário associado ao ID contido no refresh token
                const user = await User.findOne({
                    _id: decodedData.id
                })

                // Se o usuário não for encontrado, retorna erro
                if (!user) {
                    return res.status(400).send({
                        message: "Algo deu errado, faça login e tente novamente."
                    })
                } else {
                    const expiresAccessToken = "60d" // Define a validade do token de acesso para 60 dias
                    const expiresRefreshToken = "1y" // Define a validade do refresh token para 1 ano

                    // Gera um novo token de acesso e um novo refresh token
                    const accessToken = generateAccessToken(user, expiresAccessToken)
                    const refreshToken = generateRefreshToken(user, expiresRefreshToken)
                    
                    // Criptografa o novo refresh token antes de armazená-lo
                    const encryptedRefreshToken = encryptRefreshToken(refreshToken)

                    // Atualiza a sessão no banco de dados com o novo refresh token e dados do usuário
                    await session.updateOne({
                        $set: {
                            ipAddress: req.ip, // Atualiza o endereço IP do usuário
                            userAgent: req.headers.userAgent, // Atualiza o agente do usuário (navegador/dispositivo)
                            crypto: {
                                key: encryptedRefreshToken.key, // Armazena a nova chave de criptografia
                                iv: encryptedRefreshToken.iv // Armazena o novo vetor de inicialização
                            },
                            token: encryptedRefreshToken.token, // Armazena o novo token de atualização criptografado
                            lastAccessed: moment()
                        }
                    })

                    // Responde com o novo token de acesso e os dados do usuário transformados
                    res.status(200).send({
                        accessToken: accessToken,
                        sessionId: session.id,
                        user: userTransformer(user), // Transforma os dados do usuário antes de enviar
                        message: "Token de acesso atualizado com sucesso."
                    })
                }
            }
        }
    } catch (err) {
        console.log(err.message) // Exibe o erro no console para depuração

        // Caso ocorra um erro interno, retorna status 500 com a mensagem de erro
        res.status(500).send({
            message: "Erro interno do servidor."
        })
    }
}

module.exports = refreshToken; // Exporta a função para ser utilizada em outras partes do código