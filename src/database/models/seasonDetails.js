
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
    farmerId: {
        type: String,
        required: true,
    },
    plotId: {
        type: String,
        required: true,
    },
    cultivationYear: {
        type: String,
        required: true,
    },
    seasonName: {
        type: String,
        required: true,
    },
    seasonType: {
        type: Number,
        required: true,
    },
    cropTypeId: {
        type: String,
        required: true,
    },
    cropTypeName: {
        type: String,
        required: true,
    },
    cropId: {
        type: String,
        required: false,
    },
    cropName: {
        type: String,
        required: true,
    },
    interventionId: {
        type: String,
        required: true,
    },
    interventionName: {
        type: String,
        required: true,
    },
    isDynamicSeasonCompleted: {
        type: Boolean,
        default: false,
    },
    isBaselineSeasonCompleted: {
        type: Boolean,
        default: false,
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
module.exports = mongoose.model('SeasonDetails', schema);
