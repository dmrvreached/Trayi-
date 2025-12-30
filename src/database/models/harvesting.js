
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
    dateOfOperation: {
        type: String,
        default: '',
    },
    residueManagement: {
        type: String,
        default: ''
    },
    isMachine: {
        type: Boolean,
        default: false,
    },
    machineType: {
        type: String,
        default: '',
    },
    machineTypeId: {
        type: String,
        default: '',
    },
    brandOfMachineId: {
        type: String,
        default: '',
    },
    isMachineHired: {
        type: Boolean,
        default: false,
    },

    machineRentPerAcre: {
        type: Number,
        default: 0,
    },
    brandOfMachine: {
        type: String,
        default: '',
    },
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
    residue_management_last_3yrs: [
  {
    year: {
      type: Number,
      required: true
    },
    management_methods: [
      {
        method: {
          type: String,
          required: true,
          enum: [
            'Removed from field',
            'Soil Incorporation',
            'Stubble Burning',
            'Fodder for Cattle',
            'Chemical Treatment'
          ]
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100,
          required: true
        }
      }
    ]
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
module.exports = mongoose.model('Harvesting', schema);
