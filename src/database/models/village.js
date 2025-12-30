
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
    name: { type: String, required: true },
    blockId: { type: String, required: true },
    blockName: { type: String, required: true },
    districtId: { type: String, required: true },
    districtName: { type: String, required: true },
    stateId: { type: String, required: true },
    stateName: { type: String, required: true },
    status: {
        type: Boolean,
        default: false
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
module.exports = mongoose.model('Village', schema);
