const mongoose = require("mongoose");

const objectSchema = new mongoose.Schema({
  operationName: {
    type: String,
    required: true,
  },
  objectId: {
    type: String,
    required: true,
  },
  operationItems: {
    dateOfOperation: {
      type: String,
      default: "",
    },
    totalNoOfIrrigationGiven: {
      type: Number,
      default: 0,
    },
    howManyHoursForIrrigation: {
      type: String,
      default: "",
    },
    averageIrrigationHours: {
      type: String,
      default: "",
    },
    unitCostPerAcre: {
      type: Number,
      default: 0,
    },
    fuelCostPerAcre: {
      type: Number,
      default: 0,
    },
    noOFLaboursForIrrigation: {
      type: Number,
      default: 0,
    },
    isReferancePhotoAvailable: {
      type: Boolean,
      default: false,
    },
    isMachineHired: {
      type: Boolean,
      default: false,
    },
    machineRentPerAcre: {
      type: Number,
      default: 0,
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
    referancePhoto: {
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
    },
  },

});

const schema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    addedByName: {
      type: String,
      default: "",
    },
    addedById: {
      type: String,
      default: "",
    },
    updatedByName: {
      type: String,
      default: "",
    },
    updatedById: {
      type: String,
      default: "",
    },
    howManyDaysYouWillKeepLandUnderSubmergedCondition: {
      type: String,
      default: "",
    },
    isControlledIrrigationFaclitiesAvalible: {
      type: Boolean,
      default: false,
    },
    isControlledDrainageFaclitiesAvalible: {
      type: Boolean,
      default: false,
    },
    sourceOfIrrigation: {
      type: String,
      default: "",
    },
    pumpType: {
      type: String,
      default: "",
    },
    pumpCompanyName: {
      type: String,
      default: "",
    },
    pumpHP: {
      type: String,
      default: "",
    },
    diameterOfBoreOutletPipePumpInInches: {
      type: String,
      default: "",
    },
    depthOfBorewell: {
      type: String,
      default: "",
    },
    operations: [objectSchema],
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
    durationOfFloodingPrePlantationDays: {
    type: Number,
    min: 0,
    default: null
  },
  
  typicalWaterLevelTopSurfaceCm: {
    type: Number,
    min: 0,
    default: null
  },
 
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret._id;
      },
    },
    timestamps: true,
  }
);
module.exports = mongoose.model("Irrigation", schema);
