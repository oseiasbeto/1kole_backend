// Importando as dependências
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const path = require("path"); // Módulo nativo do Node.js para manipulação de caminhos de arquivos
const cors = require("cors"); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const express = require("express"); // Framework web para Node.js, usado para criar o servidor
const app = express(); // Instância do Express

// Conectar com o banco de dados
const connectDB = require('./config/connectDb'); // Função para conectar ao banco de dados
connectDB(); // Estabelece a conexão com o banco de dados

// Configurando os middlewares
app.use(cors()); // Habilita o CORS para que o servidor aceite requisições de outros domínios
app.use(express.json()); // Permite que o Express interprete requisições com JSON no corpo (necessário para POST, PUT, etc.)
app.use("/files", express.static(path.resolve(__dirname, "..", "uploads"))); // Serve arquivos estáticos da pasta "uploads" através da rota "/files"

// Importando as rotas do aplicativo
const users = require("./use-cases/users/users.routes"); // Importa as rotas de usuários
const kools = require("./use-cases/kools/kools.routes"); // Importa as rotas de kools (posts)
const notifications = require("./use-cases/notifications/notifications.routes"); 

// Usando as rotas no aplicativo
app.use("/v1/users", users); 
app.use("/v1/kools", kools);
app.use("/v1/notifications", notifications);

// Exportando o app para que ele possa ser usado em outros arquivos
module.exports = { app }; // Exporta a instância do app para uso em testes ou inicialização do servidor
