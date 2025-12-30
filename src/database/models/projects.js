
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
    },
    shortName: {
        type: String,
        default: '',
    },
    typeOfPractice: {
        type: String,
        default: '',
    },
    crops: [{
        id: { type: String, default: '' },
        cropTypeName: { type: String, default: '' },
        cropTypeId: { type: String, default: '' },
        crops: [{
            cropTypeId: { type: String, default: '' },
            cropName: { type: String, default: '' },
            cropId: { type: String, default: '' },
            status: { type: Boolean, default: true },
        }],
        interventions: [{
            cropId: { type: String, default: '' },
            isBaselineDefault: { type: Boolean, default: false },
            interventionName: { type: String, default: '' },
            interventionId: { type: String, default: '' },
            status: { type: Boolean, default: true },
        }],
        status: { type: Boolean, default: true }

    }],
    regions: [{
        id: { type: String, default: '' },
        stateName: { type: String, default: '' },
        stateId: { type: String, default: '' },
        districts: [{
            stateId: { type: String, default: '' },
            districtName: { type: String, default: '' },
            districtId: { type: String, default: '' },
            status: { type: Boolean, default: true },
        }],
        blocks: [{
            districtId: { type: String, default: '' },
            blockName: { type: String, default: '' },
            blockId: { type: String, default: '' },
            status: { type: Boolean, default: true },
        }],
        villages: [{
            blockId: { type: String, default: '' },
            villageName: { type: String, default: '' },
            villageId: { type: String, default: '' },
            status: { type: Boolean, default: true },
        }],
        status: { type: Boolean, default: true }
    }],
    status: { type: Boolean, default: true }
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        },
    },
    timestamps: true,
});
module.exports = mongoose.model('Projects', schema);
