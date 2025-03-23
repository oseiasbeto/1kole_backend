const mongoose = require("mongoose");

const user = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "O nome de usuário é obrigatório."],
            unique: true,
            minlength: [3, "O nome de usuário deve ter no mínimo 3 caracteres."],
            maxlength: [30, "O nome de usuário deve ter no máximo 30 caracteres."],
        },
        verified: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            required: [true, "O nome é obrigatório."],
            maxlength: [50, "O nome pode ter no máximo 50 caracteres."],
        },
        email: {
            type: String,
            required: [
                function() {
                    return !this.googleId && !this.facebookId;
                },
                "O e-mail é obrigatório para usuários que não usam redes sociais."
            ],
            unique: true,
            match: [/^\S+@\S+\.\S+$/, "Por favor, insira um endereço de e-mail válido."],
        },
        password: {
            type: String,
            required: [true, "A senha é obrigatória."],
            minlength: [6, "A senha deve ter no mínimo 6 caracteres."],
        },
        profileImage: {
            public_id: { type: String, default: null },
            original: { type: String, default: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' },
            low: { type: String, default: null },
            high: { type: String, default: null },
            medium: { type: String, default: null },
            url: { type: String, default: null }
        },
        coverPhoto: {
            public_id: { type: String, default: null },
            original: { type: String, default: null },
            low: { type: String, default: null },
            high: { type: String, default: null },
            medium: { type: String, default: null },
        },
        bio: {
            type: String,
            maxlength: [160, "A bio pode ter no máximo 160 caracteres."],
            default: "",
        },
        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        googleId: {
            type: String,
            default: null,
        },
        facebookId: {
            type: String,
            default: null,
        },
        koolsCount: {
            type: Number,
            default: 0,
        },
        unreadNotificationsCount: {
            type: Number,
            default: 0,
        },
        unreadMessagesCount: {
            type: Number,
            default: 0,
        },
        phoneNumber: {
            type: String,
            match: [/^\+?[1-9]\d{1,14}$/, "Por favor, insira um número de telefone válido."],
            default: "",
        },
        verificationToken: {
            type: String,
            required: false,
        },
        verificationTokenExpires: {
            type: Date,
            required: false,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "inactive",
        },
        birthDate: {
            type: Date,
            required: false,
        },
        website: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            enum: ["male", "female", "other", "prefer_not_to_say"],
            default: "prefer_not_to_say",
        },
        location: {
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            country: { type: String, default: "" },
        },
        interests: [{
            type: String,
        }],
        relationshipStatus: {
            type: String,
            enum: ["single", "in_a_relationship", "married", "divorced", "complicated"],
            default: "single",
        },
        privacySettings: {
            profileVisibility: { type: String, enum: ["public", "friends_only", "private"], default: "public" },
            messagePrivacy: { type: String, enum: ["public", "friends_only", "private"], default: "friends_only" },
        },
        blockedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        activityHistory: [{
            type: mongoose.Schema.Types.Mixed,
        }],
        notificationSettings: {
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
        },
        loginHistory: [{
            timestamp: { type: Date, default: Date.now },
            ipAddress: { type: String },
            device: { type: String },
        }],
        accountVerificationStatus: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        preferredLanguage: {
            type: String,
            default: "en",
        },
        themeSettings: {
            type: String,
            enum: ["light", "dark"],
            default: "light",
        },
    },
    { timestamps: true }
);

user.index({ username: 1, email: 1 });

module.exports = mongoose.model("User", user);