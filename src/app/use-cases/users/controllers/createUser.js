const User = require("../../../models/User");
const Session = require("../../../models/Session");
const bcrypt = require("bcryptjs");
const moment = require("moment")
const userTransformer = require("../../../utils/userTransformer")
const { randomUUID } = require("crypto"); // Para gerar um token de verificação único
const generateAccessToken = require("../../../utils/generateAccessToken"); // Função para gerar o token de acesso
const generateRefreshToken = require("../../../utils/generateRefreshToken"); // Função para gerar o refresh token
const encryptRefreshToken = require("../../../utils/encryptRefreshToken"); // Função para criptografar o refresh token
const sendMail = require("../../../mail/sendMail");
// const sendEmail = require("../utils/sendEmail"); // Utilitário para enviar o e-mail de confirmação (comentado)

// Controller para criação de um novo usuário
const createUser = async (req, res) => {
    try {
        const expiresAccessToken = "60d"; // O tempo de expiração do access token (60 dias)
        const expiresRefreshToken = "1y"; // O tempo de expiração do refresh token (1 ano)

        // Extraímos os dados do corpo da requisição
        const { username, name, email, password, birthDate, phoneNumber, socialAuth, socialId } = req.body;

        // Se a autenticação for via rede social (Google ou Facebook)
        if (socialAuth && socialId) {
            let user = await User.findOne({ $or: [{ googleId: socialId }, { facebookId: socialId }] });

            // Se o usuário já existir, loga o usuário e cria uma nova sessão
            if (user) {
                const accessToken = generateAccessToken(user, expiresAccessToken);
                const refreshToken = generateRefreshToken(user, expiresRefreshToken);

                const encryptedRefreshToken = encryptRefreshToken(refreshToken);

                const newSession = new Session({
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || 'Unknown', // Garantindo que sempre ,
                    crypto: {
                        key: encryptedRefreshToken.key,
                        iv: encryptedRefreshToken.iv
                    },
                    expiresAt: moment().add("1", "y"),
                    token: encryptedRefreshToken.token,
                    user: user._id
                });

                if (newSession) {
                    await newSession.save();

                    return res.status(200).send({
                        accessToken: accessToken,
                        sessionId: newSession.id,
                        user: userTransformer(user),
                        message: "Usuário já registrado. Login bem-sucedido."
                    });
                }
            }
        }

        // Validação do e-mail
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: "Por favor, forneça um e-mail válido" });
        }

        // Validação do username (nome de usuário)
        else if (!username || username.length < 3 || username.length > 30) {
            return res.status(400).json({ message: "O nome de usuário deve ter entre 3 e 30 caracteres" });
        }

        // Verifica se o username contém apenas caracteres permitidos (letras, números e sublinhados)
        else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: "O nome de usuário deve conter apenas letras, números e sublinhados" });
        }

        // Validação do nome
        else if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "O nome é obrigatório." });
        }

        // Validação da senha
        else if (!password || password.length < 6 || !/(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres e conter uma letra maiúscula e um número" });
        }

        // Validação da data de nascimento
        else if (!birthDate) {
            return res.status(400).json({ message: "A data de nascimento é obrigatória" });
        }

        // Validação do username novamente para garantir que ele seja único
        else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
            return res.status(400).json({ message: "O nome de usuário é inválido. Apenas letras, números e _ são permitidos." });
        }
        else {
            // Verifica se o nome de usuário já está em uso
            let user = await User.findOne({ username });
            if (user) {
                return res.status(400).json({ message: "Nome de usuário já em uso." });
            }

            // Verifica se o e-mail já está registrado
            user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: "E-mail já registrado." });
            }

            // Verifica se o número de telefone já está registrado (caso tenha sido informado)
            if (phoneNumber) {
                user = await User.findOne({ phoneNumber });
                if (user) {
                    return res.status(400).json({ message: "Número de telefone já registrado." });
                }
            }

            // Verifica se a data de nascimento foi informada
            if (!birthDate) {
                return res.status(400).json({ message: "A data de nascimento é obrigatória." });
            }

            // Criptografa a senha antes de salvar no banco
            const salt = await bcrypt.genSalt(10); // Gera um salt de 10 rounds
            const hashedPassword = await bcrypt.hash(password, salt);

            // Cria um novo usuário
            user = new User({
                username,
                name,
                email,
                password: hashedPassword,
                phoneNumber,
                birthDate,
                googleId: socialAuth === 'google' ? socialId : null,
                facebookId: socialAuth === 'facebook' ? socialId : null,
                status: "inactive", // O status inicia como inativo até o e-mail ser verificado
            });

            // Se não for um login via rede social, envia um token de verificação para o e-mail
            if (!socialAuth) {
                const verificationToken = `${Date.now()}${Math.floor(Math.random() * 10000)}`; // Gera um token único para a verificação
                user.verificationToken = verificationToken;
                user.verificationTokenExpires = moment().add('1', 'h'); // O token expira em 1 hora

                // Salva o usuário no banco
                await user.save();

                const title = "Confirme seu cadastro";
                const message = "Use o código abaixo para confirmar seu cadastro no 1kole:";

                await sendMail(user.email, "confirmation_code", title, { code:verificationToken, title, message });

                // Retorna a resposta de sucesso com o token e ID do usuário
                return res.status(201).json({
                    user: userTransformer(user),
                    message: "Usuário criado com sucesso."
                });
            } else {
                // Para login via redes sociais, cria a sessão diretamente sem verificação de e-mail

                const accessToken = generateAccessToken(user, expiresAccessToken);
                const refreshToken = generateRefreshToken(user, expiresRefreshToken);

                const encryptedRefreshToken = encryptRefreshToken(refreshToken);

                const newSession = new Session({
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || 'Unknown', // Garantindo que sempre ,
                    crypto: {
                        key: encryptedRefreshToken.key,
                        iv: encryptedRefreshToken.iv
                    },
                    expiresAt: moment().add("1", "y"),
                    token: encryptedRefreshToken.token,
                    user: user._id
                });

                if (newSession) {
                    await newSession.save();
                    user.status = 'active'
                    await user.save();

                    return res.status(200).send({
                        accessToken: accessToken,
                        sessionId: newSession.id,
                        user: userTransformer(user),
                        message: "Usuário já registrado. Login bem-sucedido."
                    });
                }
            }
        }
    } catch (error) {
        // Tratamento de erros em caso de falha em qualquer parte do processo
        console.error("Erro ao criar usuário:", error);
        return res.status(500).json({ message: "Erro interno no servidor. Tente novamente mais tarde." });
    }
};

module.exports = createUser;