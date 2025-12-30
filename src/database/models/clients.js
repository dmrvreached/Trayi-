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
    projects: [{
        name: { type: String, default: '' },
        projectId: { type: String, default: '' },
        status: { type: Boolean, default: true }
    }],
    alternatePhone: {
        type: String,
        default: ''
    },
    fieldCollectorIncharge: { type: String, default: '' },
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
    location: { type: String, default: '' },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
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
            delete ret.password;
            delete ret.__v;
            delete ret._id;
            delete ret.isDeleted;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Clients', schema);
