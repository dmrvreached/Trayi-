const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: { type: String, required: true },

    name: { type: String, required: true, unquie: true },
    description: { type: String, default: '' },
    userPermissions: { type: Array, default: [] },
    defaultPages: { type: Array, default: [] },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
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
    },
    updatedById: {
        type: String,
    },
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
            delete ret.isDeleted;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Roles', schema);
