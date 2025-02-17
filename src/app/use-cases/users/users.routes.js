const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
const validObjectId = require("../../middlewares/validObjectId")
const upload = require("../../middlewares/upload"); // Middleware para upload de arquivos

// importando os controllers
const createUser = require("./controllers/createUser")
const authUser = require("./controllers/authUser")
const refreshToken = require("./controllers/refreshToken")
const followUser = require("./controllers/followUser")
const unfollowUser = require("./controllers/unfollowUser")
const updateProfile = require("./controllers/updateProfile")
const getUserByUsername = require("./controllers/getUserByUsername")
const destroySession = require("./controllers/destroySession")
const checkEmailExists = require("./controllers/checkEmailExists")
const checkUsernameExists = require("./controllers/checkUsernameExists")
const checkAccount = require("./controllers/checkAccount")
const forgotPassword = require("./controllers/forgotPassword")
const resetPassword = require("./controllers/resetPassword")
const getUsers = require("./controllers/getUsers")

// configurando as rotas
router.post("/register", createUser)
router.post("/login", authUser)
router.post("/refresh-token", refreshToken)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.put("/follow/:id", validObjectId, protectedRoute, followUser)
router.put("/unfollow/:id", validObjectId, protectedRoute, unfollowUser)
router.get("/:username", protectedRoute, getUserByUsername)
router.get("/", protectedRoute, getUsers)
router.delete("/session/:id", destroySession)
router.get("/check-email/:email", checkEmailExists)
router.get("/check-username/:username", checkUsernameExists)
router.post("/check-account", checkAccount)
router.put("/", protectedRoute, upload.fields([
    { name: "profileImage", maxCount: 1 }, // Permite apenas uma imagem de perfil
    { name: "coverPhoto", maxCount: 1 },   // Permite apenas uma foto de capa
]), updateProfile)

// exportando as rotas
module.exports = router