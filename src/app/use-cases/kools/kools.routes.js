const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
const validObjectId = require("../../middlewares/validObjectId")
const upload = require("../../middlewares/upload"); // Middleware para upload de arquivos

// importando os controllers
const createKool = require("./controllers/createKool")
const editKool = require("./controllers/editKool")
const toggleLikeKool = require("./controllers/toggleLikeKool")
const deleteKool = require("./controllers/deleteKool")
const viewKool = require("./controllers/viewKool")
const getAllKools = require("./controllers/getAllKools")
const trendingTags = require("./controllers/trendingTags")

// configurando as rotas
router.post("/", protectedRoute, createKool)
router.put("/:id", validObjectId, protectedRoute, editKool)
router.put("/like/:id", validObjectId, protectedRoute, toggleLikeKool)
router.delete("/:id", validObjectId, protectedRoute, deleteKool)
router.get("/trending-tags", protectedRoute, trendingTags)
router.get("/:id", validObjectId, protectedRoute, viewKool)
router.get("/", protectedRoute, getAllKools)

// exportando as rotas
module.exports = router