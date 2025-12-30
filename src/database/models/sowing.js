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
    dateOfOperation: {
      type: String,
      default: "",
    },
    methodOfSowing: {
      type: String,
      default: "",
    },
    isMachine: {
      type: Boolean,
      default: false,
    },
    machineTypeId: {
      type: String,
      default: "",
    },
    brandOfMachineId: {
      type: String,
      default: "",
    },
    machineType: {
      type: String,
      default: "",
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
      default: "",
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
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
    },
    plotDocumentPhoto: {
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
    },
    plotLivePhoto: {
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
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
module.exports = mongoose.model("Sowing", schema);
