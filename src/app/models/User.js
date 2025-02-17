// Importando o Mongoose para trabalhar com o MongoDB
const mongoose = require("mongoose");

// Definindo o esquema para o usuário (user)
const user = new mongoose.Schema(
    {
        // Nome de usuário, único, com limite mínimo e máximo de caracteres
        username: {
            type: String,  // Tipo de dado: String
            required: [true, "O nome de usuário é obrigatório."], // Campo obrigatório
            unique: true,   // Nome de usuário único
            minlength: [3, "O nome de usuário deve ter no mínimo 3 caracteres."], // Limite mínimo de caracteres
            maxlength: [30, "O nome de usuário deve ter no máximo 30 caracteres."], // Limite máximo de caracteres
        },
        // Propriedade que indica se o usuário foi verificado (por email, por exemplo)
        verified: {
            type: Boolean,   // Tipo de dado: Booleano
            default: false,  // Valor padrão: falso (não verificado)
        },
        // Nome curto do usuário, usado para exibição na interface
        name: {
            type: String,    // Tipo de dado: String
            required: [true, "O nome é obrigatório."],  // Campo obrigatório
            maxlength: [50, "O nome pode ter no máximo 50 caracteres."],  // Limite máximo de caracteres
        },
        // E-mail do usuário, com validação de formato
        email: {
            type: String,           // Tipo de dado: String
            required: [true, "O e-mail é obrigatório."],         // Campo obrigatório
            unique: true,           // E-mail único
            match: [/^\S+@\S+\.\S+$/, "Por favor, insira um endereço de e-mail válido."], // Validação de formato de e-mail
        },
        // Senha do usuário, com tamanho mínimo de 6 caracteres
        password: {
            type: String,    // Tipo de dado: String
            required: [true, "A senha é obrigatória."],  // Campo obrigatório
            minlength: [6, "A senha deve ter no mínimo 6 caracteres."],    // Tamanho mínimo: 6 caracteres
        },
        // Imagem do perfil do usuário, com um valor padrão
        profileImage: {
            public_id: { type: String, default: null },
            url: { type: String, default: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' },
        },
        coverPhoto: {
            public_id: { type: String, default: null },
            url: { type: String, default: null },
        },
        // Bio do usuário, com limite de 160 caracteres
        bio: {
            type: String,    // Tipo de dado: String
            maxlength: [160, "A bio pode ter no máximo 160 caracteres."],  // Limite de caracteres
            default: "",     // Valor padrão (bio vazia)
        },
        // Lista de seguidores do usuário (referências a outros documentos de usuários)
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId, // Tipo de dado: ObjectId (referência a outro usuário)
                ref: "User", // Refere-se ao modelo "User"
            },
        ],
        // Lista de usuários que o usuário está seguindo (referências a outros documentos de usuários)
        following: [
            {
                type: mongoose.Schema.Types.ObjectId, // Tipo de dado: ObjectId (referência a outro usuário)
                ref: "User", // Refere-se ao modelo "User"
            },
        ],
        // ID do usuário associado ao Google (caso o login seja via Google)
        googleId: {
            type: String,    // Tipo de dado: String
            default: null
        },
        // ID do usuário associado ao Facebook (caso o login seja via Facebook)
        facebookId: {
            type: String,    // Tipo de dado: String
            default: null
        },
        // Contagem de "Kools" (posts ou ações do usuário, exemplo)
        koolsCount: {
            type: Number,   // Tipo de dado: Número
            default: 0,     // Valor padrão: 0 (nenhum Kool ainda)
        },
        // Armazena a quantidade total de notificações não lidas pelo usuário
        unreadNotificationsCount: {
            type: Number,   // Tipo de dado: Número
            default: 0,     // Começa com 0, pois inicialmente não há notificações pendentes
        },
        // Armazena a quantidade de mensagens diretas não lidas pelo usuário
        unreadMessagesCount: {
            type: Number,   // Tipo de dado: Número
            default: 0,     // Começa com 0, pois inicialmente não há mensagens pendentes
        },
        // Número de telefone do usuário, com validação de formato
        phoneNumber: {
            type: String,    // Tipo de dado: String
            match: [/^\+?[1-9]\d{1,14}$/, "Por favor, insira um número de telefone válido."], // Validação de formato de número
            default: ""
        },
        // Token para verificar a conta, se solicitado pelo usuário
        verificationToken: {
            type: String,    // Tipo de dado: String
            required: false, // Não obrigatório
        },
        // Data de expiração do token de verificacao de conta
        verificationTokenExpires: {
            type: Date,      // Tipo de dado: Date
            required: false, // Não obrigatório
        },
        resetPasswordToken: {
            type: String,    // Tipo de dado: String
            default: null
        },
        // Data de expiração do token de redefinição de senha
        resetPasswordExpires: {
            type: Date,      // Tipo de dado: Date
            default: null
        },
        // Status do usuário, podendo ser "active" ou "inactive"
        status: {
            type: String,            // Tipo de dado: String
            enum: ["active", "inactive"], // Valores possíveis: "active" ou "inactive"
            default: "inactive",     // Valor padrão: "inactive" (usuário inativo até ser verificado)
        },
        // Data de nascimento do usuário
        birthDate: {
            type: Date,    // Tipo de dado: Date
            required: false, // Não obrigatório
        },
        // Data de nascimento do usuário
        website: {
            type: String,    // Tipo de dado: Date
            default: ""
        },
    },
    { timestamps: true } // Adiciona campos de "createdAt" e "updatedAt" automaticamente
);

// Criando um índice para melhorar a performance nas buscas por username, email e phoneNumber
user.index({ username: 1, email: 1 });

// Exportando o modelo "User" baseado no esquema "user"
module.exports = mongoose.model("User", user);
