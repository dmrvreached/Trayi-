
const mongoose = require('mongoose');

const objectSchema = new mongoose.Schema({

    operationName: {
        type: String,
        required: true,
    },
    objectId: {
        type: String,
        required: true
    },
    operationItems: {
        dateOfApplication: {
            type: String,
            default: '',
        },
        fertilizer: [{
            typeOfApplication: {
                type: String,
                required: true,
            },
            nameOfTheFertilizer: {
                type: String,
                default: '',
            },
            fertilizerTypeId: {
                type: String,
                default: '',
            },
            costOfTheFertilizer: {
                type: Number,
                default: 0,
            },
            quantityPerAcre: {
                type: String,
                default: '',
            },
            unit: {
                type: String,
                default: '',
            },

        }],
        isLabour: {
            type: Boolean,
            default: false,
        },
        hiredMaleLabours: {
            type: Number,
            default: 0,
        },
        hiredFemaleLabours: {
            type: Number,
            default: 0,
        },
        wagesPerDayPerMale: {
            type: Number,
            default: 0,
        },
        wagesPerDayPerFemale: {
            type: Number,
            default: 0,
        },
        domesticMaleLabours: {
            type: Number,
            default: 0,
        },
        domesticFemaleLabours: {
            type: Number,
            default: 0,
        },
        contractual: {
            type: Boolean,
            default: false,
        },
        costPerAcre: {
            type: Number,
            default: 0,
        },
        isReferancePhotoAvailable: {
            type: Boolean,
            default: false,
        },
        referancePhoto: {
            originalName: { type: String, default: '' },
            blobName: { type: String, default: '' },
            url: { type: String, default: '' },
            timeStamp: { type: String, default: '' },
            coords: { type: Array, default: '' }
        },
    }
});

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
    operations: [objectSchema]
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        },
    },
    timestamps: true,
});
module.exports = mongoose.model('fertilizerApplications', schema);
