const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")

// importando os controllers
const markAsRead = require("./controllers/markAsRead")
const markAllAsRead = require("./controllers/markAllAsRead")
const getNotifications = require("./controllers/getNotifications")
const deleteNotification = require("./controllers/deleteNotification")

// configurando as rotas
router.get("/", protectedRoute, getNotifications)
router.put("/:id/read", protectedRoute, markAsRead)
router.put("/read-all", protectedRoute, markAllAsRead)
router.delete("/:id", protectedRoute, deleteNotification)

// exportando as rotas
module.exports = router