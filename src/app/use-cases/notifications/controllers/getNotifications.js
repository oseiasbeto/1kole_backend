const Notification = require("../../../models/Notification");
const User = require("../../../models/User");
const userTransformer = require("../../../utils/userTransformer");

const getUsers = async (req, res) => {
    try {
        // Clona o objeto de consulta da requisição para manipulação
        const queryObj = { ...req.query };

        // Remove campos que não são usados no filtro
        const excludeFields = ['page', 'sort', 'limit', 'fields', 'populate'];
        excludeFields.forEach(el => delete queryObj[el]);

        // Transforma operadores de comparação em operadores do MongoDB
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne|in|nin|exists)\b/g, match => `$${match}`);

        // Configura a ordenação dos resultados
        const sortBy = req.query.sort ? req.query.sort.split(",").join(" ") : '-createdAt';

        // Define quais campos serão retornados na resposta
        const fields = req.query.fields ? req.query.fields.split(",").join(" ") : '';

        // Configura a paginação
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Inicia a query com os parâmetros definidos
        let query = Notification.find(JSON.parse(queryStr))
            .select(fields)
            .sort(sortBy)
            .skip(skip)
            .limit(limit);


        // Adiciona populate dinamicamente se especificado na consulta
        if (req.query.populate) {
            const populateFields = req.query.populate.split(',');


            populateFields.forEach(field => {
                if (field.trim() === 'relatedUsers') {
                    // Usa userTransformer para o campo 'author' dos kools principais
                    query = query.populate({
                        path: 'relatedUsers',
                        transform: (doc) => userTransformer(doc)
                    });
                }
                query = query.populate(field.trim()); // Aplica populate para outros campos especificados
            });
        }

        // Executa a consulta no banco de dados
        const notifications = await query;


        // Cria metadados de paginação
        let metadata = {};

        await User.updateOne({
            _id: req.user.id
        }, {
            $set: {
                unreadNotificationsCount: 0
            }
        })
        if (req.query.page && notifications.length) {
            const count = await Notification.countDocuments(JSON.parse(queryStr));
            if (skip > count) {
                return res.status(404).send({ message: "Esta página não existe" });
            }
            metadata = {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalDocuments: count
            };
        }

        // Envia a resposta com os documentos e metadados
        res.status(200).send({ notifications, metadata });
    } catch (err) {
        // Trata erros e envia uma resposta de erro
        res.status(500).send({ message: err.message });
    }
}

module.exports = getUsers;