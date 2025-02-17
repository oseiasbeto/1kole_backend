// Importa o modelo Kool, que representa os posts (Kools) na base de dados
const Kool = require("../../../models/Kool");

// Função para buscar as tags mais populares (trending topics)
const trendingTags = async (req, res) => {
    try {
        const trendingTags = await Kool.aggregate([
            { 
                $unwind: "$tags" // Separa cada tag individualmente, transformando um array de tags em múltiplos documentos
            },
            { 
                $group: { 
                    _id: "$tags", // Agrupa os documentos por tag
                    count: { $sum: 1 } // Conta quantas vezes cada tag aparece nos Kools
                } 
            },
            { 
                $sort: { count: -1 } // Ordena os resultados pela quantidade de aparições em ordem decrescente (tags mais usadas primeiro)
            },
            { 
                $limit: 10 // Limita a resposta às 10 tags mais populares
            }
        ]);

        // Retorna as trending tags em formato JSON
        res.status(200).json(trendingTags);
    } catch (error) {
        // Em caso de erro, retorna uma mensagem de erro com status 500
        res.status(500).json({ message: "Erro ao buscar trending tags" });
    }
};

// Exporta a função para ser usada em outras partes da aplicação
module.exports = trendingTags;
