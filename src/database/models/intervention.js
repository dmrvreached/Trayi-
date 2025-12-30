const mongoose = require('mongoose');

const schema = new mongoose.Schema({

    id: { type: String, required: true, unique: true },

    name: { type: String, required: true, unique: true },
    

    cropTypeId: { type: String, required: true },
    cropTypeName: { type: String, required: true },

    cropId: { type: String, required: true },
    cropName: { type: String, required: true },

    isBaselineDefault: { type: Boolean, default: false },

    pop: [{
        sno: { type: String, required: true },
        popId: { type: String, required: true },
        popName: { type: String, required: true },
        shortName: { type: String, required: true },
        activities: { type: Array },
        status: { type: Boolean, default: true },
    }],

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
    },
    updatedById: {
        type: String,
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

module.exports = mongoose.model('Interventions', schema);
