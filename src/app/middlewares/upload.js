const multer = require("multer");

// Armazena na memória para enviar direto ao Cloudinary
const storage = multer.memoryStorage(); 

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 2MB máximo
});

module.exports = upload;
