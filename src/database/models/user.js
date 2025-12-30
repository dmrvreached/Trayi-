const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: { type: String, required: true },

    fullName: { type: String, required: true },
    password: { type: Object },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        uniqueCaseInsensitive: true
    },
    phone: {
        type: String,
        unique: true
    },
    otp: { type: Number, default: 1234 },
    roleId: { type: String, required: true },
    roleName: { type: String, required: true },
    userPermissions: [],
    emailVerification: { type: Boolean, default: false },
    phoneVerification: { type: Boolean, default: false },
    photo: {
        originalName: { type: String, default: '' },
        blobName: { type: String, default: '' },
        url: { type: String, default: '' },
    },
    JWT_token: { type: String, default: '' },
    deviceToken: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    addedByName: {
        type: String,
    },
    addedById: {
        type: String,
    },
    updatedByName: {
        type: String,
    },
    updatedById: {
        type: String,
    },

}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.otp;
            delete ret.emailVerification;
            delete ret.phoneVerification;
            delete ret.__v;
            delete ret._id;
            delete ret.isDeleted;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Users', schema);
