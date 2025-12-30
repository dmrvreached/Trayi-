
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    addedByName: {
        type: String,
        default: ''
    },
    addedById: {
        type: String,
        default: ''
    },
    updatedByName: {
        type: String,
        default: ''
    },
    updatedById: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    roleName: {
        type: String,
        required: true,
    },
    roleId: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
    }
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        },
    },
    timestamps: true,
});
module.exports = mongoose.model('Notification', schema);
