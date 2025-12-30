
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
    name: {
        type: String,
        required: true,
        unique: true,
    },
    cropName: {
        type: String,
        required: true,
    },
    cropId: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true
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
module.exports = mongoose.model('SeedVarity', schema);
