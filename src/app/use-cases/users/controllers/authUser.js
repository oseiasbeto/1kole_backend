// Importando dependências e módulos necessários
const User = require("../../../models/User") // Modelo do usuário para interagir com a base de dados
const generateAccessToken = require("../../../utils/generateAccessToken") // Função para gerar o access token
const generateRefreshToken = require("../../../utils/generateRefreshToken") // Função para gerar o refresh token
const encryptRefreshToken = require("../../../utils/encryptRefreshToken") // Função para criptografar o refresh token
const userTransformer = require("../../../utils/userTransformer") // Função para transformar o usuário para uma resposta mais limpa
const { compare } = require("bcryptjs") // Função para comparar a senha fornecida com a armazenada
const Session = require("../../../models/Session") // Modelo de sessão para registrar as sessões ativas

const moment = require("moment")

const authUser = async (req, res) => {
    try {
        // Extraindo os dados de login da requisição
        const { emailOrUsername, password } = req.body;

        // Verificando se o e-mail ou nome de usuário foi fornecido
        if (emailOrUsername == '' || emailOrUsername == undefined) {
            return res.status(400).send({
                message: "O email ou nome de utilizador é obrigatório."
            });
        }

        // Verificando se a senha foi fornecida
        else if (password == '' || password == undefined) {
            return res.status(400).send({
                message: "A palavra-passe é obrigatória."
            });
        } else {
            // Buscando o usuário ativo no banco de dados usando o email ou nome de usuário
            const user = await User.findOne({
                $or: [
                    { email: emailOrUsername },
                    { username: emailOrUsername }
                ],
                status: 'active'
            });

            // Se o usuário for encontrado e a senha estiver correta
            if (user && await compare(password, user.password)) {
                // Verificando o status do usuário, se for 'p' (provavelmente 'pendente'), retorna um erro
                if (user.status == 'p') {
                    return res.status(400).send({
                        message: "Ups! Não existe nenhum usuário ativo com este e-mail."
                    });
                } else {
                    // Configurando o tempo de expiração dos tokens
                    const expiresAccessToken = "60d"; // O tempo de expiração do access token (60 dias)
                    const expiresRefreshToken = "1y"; // O tempo de expiração do refresh token (1 ano)

                    // Gerando os tokens (Access Token e Refresh Token)
                    const accessToken = generateAccessToken(user, expiresAccessToken);
                    const refreshToken = generateRefreshToken(user, expiresRefreshToken);

                    // Criptografando o refresh token para armazenar de forma segura
                    const encryptedRefreshToken = encryptRefreshToken(refreshToken);

                    // Criando uma nova sessão com as informações do usuário e do dispositivo
                    const newSession = new Session({
                        ipAddress: req.ip, // Armazenando o IP do usuário
                        userAgent: req.headers['user-agent'] || 'Unknown', // Garantindo que sempre haja um valor
                        crypto: {
                            key: encryptedRefreshToken.key, // Chave criptografada
                            iv: encryptedRefreshToken.iv,   // Vetor de inicialização (IV) usado na criptografia
                        },
                        token: encryptedRefreshToken.token, // O token criptografado
                        user: user._id, // Associando a sessão ao ID do usuário
                        expiresAt: moment().add(1, 'y').toDate() // Definindo a data de expiração para 1 ano a partir de agora
                    });

                    // Se a nova sessão foi criada com sucesso, salva no banco de dados
                    if (newSession) {
                        await newSession.save();

                        // Responde com os tokens gerados e os dados do usuário
                        return res.status(200).send({
                            accessToken: accessToken, // Access token
                            sessionId: newSession.id,  // ID da sessão criada
                            user: userTransformer(user), // Dados do usuário, transformados para uma resposta mais limpa
                            message: "Usuário logado com sucesso." // Mensagem de sucesso
                        });
                    }
                }
            } else {
                // Se as credenciais não são válidas, responde com erro
                return res.status(400).send({
                    message: "Ups! Credenciais inválidas."
                });
            }
        }
    } catch (err) {
        // Caso ocorra algum erro durante o processo, responde com status 500
        return res.status(500).send({
            message: err.message // Mensagem de erro
        });
    }
}

module.exports = authUser