
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
    isSoilTest: {
        type: Boolean,
        default: false,
    },
    soilTexture: {
        type: String,
        default: '',
    },
    phLevel: {
        type: String,
        default: '',
    },
    bulkDensity: {
        type: String,
        default: '',
    },
    oraganicCorbon: {
        type: String,
        default: '',
    },
    totalN: {
        type: String,
        default: '',
    },
    availableP: {
        type: String,
        default: '',
    },
    availableK: {
        type: String,
        default: '',
    },
    availableCa: {
        type: String,
        default: '',
    },
    availableMg: {
        type: String,
        default: '',
    },
    availableZn: {
        type: String,
        default: '',
    },
    availableCU: {
        type: String,
        default: '',
    },
    availableFe: {
        type: String,
        default: '',
    },
    availableMn: {
        type: String,
        default: '',
    },
    availableS: {
        type: String,
        default: '',
    },
    availableB: {
        type: String,
        default: '',
    },
    plotId: {
        type: String,
        required: true,
    },
    farmerId: {
        type: String,
        required: true,
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
module.exports = mongoose.model('SoilInformation', schema);
