
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
    plotCode: {
        type: String,
        required: true,
    },
    farmerId: {
        type: String,
        required: true,
    },
    landmarkOrAddress: {
        type: String,
        default: '',
    },
    stateName: {
        type: String,
        required: true,
    },
    stateId: {
        type: String,
        required: true,
    },
    districtName: {
        type: String,
        required: true,
    },
    districtId: {
        type: String,
        required: true,
    },
    blockName: {
        type: String,
        required: true,
    },
    blockId: {
        type: String,
        required: true,
    },
    villageName: {
        type: String,
        required: true,
    },
    villageId: {
        type: String,
        default: ''
    },
    latitude: {
        type: String,
        default: '',
    },
    longitude: {
        type: String,
        default: '',
    },
    totalLandOwnedInAcres: {
        type: String,
        default: '',
    },
    plotBoundries: {
        type: Array,
        default: [],
    },
    totalAreaUnderProjectInAcres: {
        type: String,
        default: '',
    },
    leasedLand: {
        type: Boolean,
        default: false,
    },
    totalLeasedLandInAcres: {
        type: String,
        default: '',
    },
    leasedLandCostPerAcreForYear: {
        type: Number,
        default: 0,
    },
    leasedLandPeriod: {
        type: String,
        default: '',
    },
    // methodOfCultivation: {
    //     type: String,
    //     required: false,
    //     default: '',
    //     min: '',
    //     max: ''
    // },
    isBaselineCompleted: {
        type: Boolean,
        default: false,
    },
    isDynamicOngoing: {
        type: Boolean,
        default: false,
    },
    isBaselineStatus: {
        type: String,
        default: 'NOT_CREATED', //ONGOING, COMPLETED
    },
    isDynamicStatus: {
        type: String,
        default: 'NOT_CREATED', //ONGOING, COMPLETED
    },
    isSoliTestCompleted: {
        type: Boolean,
        default: false
    },
    baselineSeasonId: {
        type: String,
        default: ''
    },
    dynamicSeasonId: {
        type: String,
        default: ''
    },
    land_owner_name : {
        type: String,
        default : ''
    },
    land_owner_contact_number : {
        type: String,
        default : ''
    },
    lease_expiry_date : {
        type: String,
        default : ''
    },
    isLandUnderInterventionLeased :{
        type: Boolean,
        default : false
    },
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        },
    },
    timestamps: true,
});
module.exports = mongoose.model('PlotDetails', schema);
