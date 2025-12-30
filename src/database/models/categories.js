const mongoose = require('mongoose');

const schema = new mongoose.Schema({

    id: { type: String, required: true },

    modelName: {
        type: String,
        required: true,
        unique: true
    },
    fields: [{
        fieldId: { type: String, required: true },
        fieldName: { type: String, required: true },
        type: { type: String, required: true },
        required: { type: Boolean, default: false },
        unique: { type: Boolean, default: false },
        requiredName: { type: String, default: '' },
        arrayItems: { type: Array, default: [] },
        objectItems: { type: Array, default: [] },
        status: { type: Boolean, default: true },
    }],
    isPOP: {
        type: Boolean,
        default: true,
    },
    status: {
        type: Boolean,
        default: true,
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

}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Categories', schema);
