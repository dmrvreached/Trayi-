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
    } 
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
    operations: [objectSchema],
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
module.exports = mongoose.model("WaterManagement", schema);
