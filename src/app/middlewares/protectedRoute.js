const jwt = require("jsonwebtoken");

/**
 * Middleware para proteger rotas autenticadas.
 * Verifica a presença e validade do token JWT no cabeçalho da requisição.
 */
const protectedRoute = (req, res, next) => {
    const authHeader = req.headers.authorization; // Obtém o cabeçalho de autorização

    // Verifica se o cabeçalho de autorização está presente
    if (!authHeader) {
        return res.status(401).json({ message: "Informe o seu token de acesso." });
    }

    const parts = authHeader.split(" ");

    // Verifica se o token possui duas partes (esquema e token)
    if (parts.length !== 2) {
        return res.status(401).json({ message: "Token inválido." });
    }

    const [scheme, token] = parts;

    // Verifica se o esquema é "Bearer"
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ message: "Token mal formatado." });
    }

    // Verifica a validade do token
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token inválido a chave incorreta." });
        }

        req.user = decoded; // Adiciona os dados do usuário decodificado ao objeto da requisição
        next(); // Continua para a próxima middleware ou rota
    });
};

module.exports = protectedRoute;
