const mongoose = require("mongoose");

/**
 * Middleware para verificar se o ID passado nos parâmetros da requisição é um ObjectId válido do MongoDB.
 */
const validateObjectId = (req, res, next) => {
    const { id } = req.params; // Obtém o ID dos parâmetros da requisição

    // Verifica se o ID é um ObjectId válido do MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID inválido." });
    }

    next(); // Se o ID for válido, continua para o próximo middleware/controlador
};

module.exports = validateObjectId;
