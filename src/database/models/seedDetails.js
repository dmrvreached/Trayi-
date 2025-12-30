const mongoose = require("mongoose");

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
    seedVariety: {
      type: String,
      default: "",
    },
    seedQuantityPerAcre: {
      type: Number,
      default: 0,
    },
    amountAcurredForSeedInKG: {
      type: Number,
      default: 0,
    },
    seedTreatment: {
      type: String,
      default: "",
    },
    seedTreatmentTypeId: {
      type: String,
      default: "",
    },
    typeOfSeedTreatmentId: {
      type: String,
      default: "",
    },

    typeOfSeedTreatment: {
      type: String,
      default: "",
    },
    nameOfTheChemicalOrBioagentUsedForSeedTreatment: {
      type: String,
      default: "",
    },
    isReferancePhotoAvailable: {
      type: Boolean,
      default: false,
    },
    seedBioChemicalQuantity: {
      type: Number,
      default: 0,
    },
    seedBioChemicalQuantityamountUsedForInKG: {
      type: Number,
      default: 0,
    },
    chemicalBioAgentUnit: {
      type: String,
      default: "",
    },
    chemicalBioAgentCostPerAcre: {
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
    seasonId: {
      type: String,
      required: true,
      unique: true,
      default: "",
    },
    plotId: {
      type: String,
      required: true,
      default: "",
    },
    farmerId: {
      type: String,
      required: true,
      default: "",
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
module.exports = mongoose.model("SeedDetails", schema);
