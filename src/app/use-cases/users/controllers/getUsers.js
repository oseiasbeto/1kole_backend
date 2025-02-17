const User = require("../../../models/User");
const userTransformer = require("../../../utils/userTransformer");

const getUsers = async (req, res) => {
    try {
        // Clona o objeto de consulta da requisição para manipulação
        const queryObj = { ...req.query };

        // Verifica se o usuário forneceu uma consulta para as tags
        if (req.query.name) {
            // Divide o termo de busca em palavras, removendo espaços em branco extras
            const searchTerms = req.query.name.trim().split(/\s+/);

            // Constrói uma expressão regular para corresponder a qualquer das palavras fornecidas
            const regex = searchTerms.map(term => {
                // Para permitir pequenos erros de digitação, podemos permitir um ou mais caracteres errados
                // Usamos '.*' para aceitar caracteres errados e '[a-z]*' para aceitar variações nas letras.
                return `.*${term.split('').join('.*')}.*`;  // Deixa a palavra mais flexível
            }).join('|');  // Junta todas as expressões com '|' (OU lógico)

            // Define o filtro para tags no formato de regex
            queryObj.name = { $regex: regex, $options: 'i' };  // 'i' para insensibilidade a maiúsculas/minúsculas
        }

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
        let query = User.find(JSON.parse(queryStr))
            .select(fields)
            .sort(sortBy)
            .skip(skip)
            .limit(limit);


        // Adiciona populate dinamicamente se especificado na consulta
        if (req.query.populate) {
            const populateFields = req.query.populate.split(',');

            populateFields.forEach(field => {
                query = query.populate(field.trim()); // Aplica populate para outros campos especificados
            });
        }

        // Executa a consulta no banco de dados
        const users = await query;

        // Cria metadados de paginação
        let metadata = {};
        if (req.query.page && users.length) {
            const count = await User.countDocuments(JSON.parse(queryStr));
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
        res.status(200).send({ users: users.map(user => userTransformer(user)), metadata });
    } catch (err) {
        // Trata erros e envia uma resposta de erro
        res.status(500).send({ message: err.message });
    }
}

module.exports = getUsers;