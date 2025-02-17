const Kool = require("../../../models/Kool");
const userTransformer = require("../../../utils/userTransformer");

/**
 * Exibe um Kool e incrementa a quantidade de visualizações.
 */
const viewKool = async (req, res) => {
  try {
    const koolId = req.params.id; // ID do Kool que será visualizado

    // Encontra o Kool pelo ID e popula o autor
    const kool = await Kool.findById(koolId)
      .populate("author")
      .populate({
        path: "parentKool",
        populate: "author"
      });

    if (!kool) {
      return res.status(404).json({ message: "Kool não encontrado." });
    }

    // Incrementa a quantidade de visualizações
    await kool.incrementViews();
    
    // Retorna a resposta com as informações filtradas do autor
    return res.status(200).json({
      message: "Kool visualizado.",
      kool: {
        ...kool.toObject(),
        author: userTransformer(kool.author) // Substitui o autor pelas informações filtradas
      }
    });
  } catch (error) {
    console.error("Erro ao visualizar Kool:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

module.exports = viewKool;
