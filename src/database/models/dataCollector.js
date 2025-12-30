const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: { type: String, required: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true },
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
    roleId: { type: String, default: '' },
    roleName: { type: String, required: true },
    userPermissions: [],
    projects: [{
        name: { type: String, default: '' },
        projectId: { type: String, default: '' },
        status: { type: Boolean, default: true }
    }],
    stateId: { type: String, required: true },
    stateName: { type: String, required: true },
    districtId: { type: String, required: true },
    districtName: { type: String, required: true },
    blockId: { type: String, default: '' },
    blockName: { type: String, default: '' },
    emailVerification: { type: Boolean, default: false },
    phoneVerification: { type: Boolean, default: false },
    photo: {
        originalName: { type: String, default: '' },
        blobName: { type: String, default: '' },
        url: { type: String, default: '' },
    },
    JWT_token: { type: String, default: '' },
    deviceToken: { type: String, default: '' },
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
            // delete ret.otp;
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

module.exports = mongoose.model('DataCollectors', schema);
