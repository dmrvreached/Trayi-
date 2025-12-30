
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
    sowingDepthInCms: {
        type: String,
        required: true,
    },
    cropDensityRowToRowInCms: {
        type: String,
        default: '',
    },
    cropDensityPlantToPlantInCms: {
        type: String,
        default: '',
    },
    daysTo50PercentFlowering: {
        type: String,
        default: '',
    },
    numberOfTillersOrHill: {
        type: String,
        default: '',
    },
    numberOfPaniclesOrHill: {
        type: String,
        default: '',
    },
    numberOfPodsOrPlant: {
        type: String,
        default: '',
    },
    numberOfCobsOrPlant: {
        type: String,
        default: '',
    },
    cobLength: {
        type: String,
        default: '',
    },
    numberOfFilledGrainsPerPanicle: {
        type: String,
        default: '',
    },
    plantHeightAfter30DaysInCms: {
        type: String,
        default: '',
    },

    plantHeightAfter30DaysInCmsPhoto: {
        originalName: { type: String, default: '' },
        blobName: { type: String, default: '' },
        url: { type: String, default: '' },
        timeStamp: { type: String, default: '' },
        coords: { type: Array, default: '' }
    },
    plantHeightAfter60DaysInCms: {
        type: String,
        default: '',
    },
    plantHeightAfter60DaysInCmsPhoto: {
        originalName: { type: String, default: '' },
        blobName: { type: String, default: '' },
        url: { type: String, default: '' },
        timeStamp: { type: String, default: '' },
        coords: { type: Array, default: '' }
    },
    plantHeightAfter90DaysInCms: {
        type: String,
        default: '',
    },
    plantHeightAfter90DaysInCmsPhoto: {
        originalName: { type: String, default: '' },
        blobName: { type: String, default: '' },
        url: { type: String, default: '' },
        timeStamp: { type: String, default: '' },
        coords: { type: Array, default: '' }
    },
    floweringOrAnthesisDateGreaterThen50Field: {
        type: String,
        default: '',
    },
    floweringOrAnthesisDateGreaterThen50FieldPhoto: {
        originalName: { type: String, default: '' },
        blobName: { type: String, default: '' },
        url: { type: String, default: '' },
        timeStamp: { type: String, default: '' },
        coords: { type: Array, default: '' }
    },
    tillerOrLeavesNumbersAt60Days: {
        type: String,
        default: '',
    },
    aboveGroundBioMass3SquareMeterPerArea: {
        type: String,
        default: '',
    },
    grainYieldIn3SqmPerArea: {
        type: String,
        default: '',
    },
    yieldPerAcreInQuintals: {
        type: String,
        default: '',
    },
    seasonId: {
        type: String,
        required: true,
        unique: true,
    },
    plotId: {
        type: String,
        required: true,
    },
    farmerId: {
        type: String,
        required: true,
    },
      last_3yrs_history: [
    {
        year: {
            type: Number,
            required: true
        },
        yield_per_acre_quintals: {
            type: Number,
            min: 0
        }
    }
]
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        },
    },
    timestamps: true,
});
module.exports = mongoose.model('CropAttributes', schema);
