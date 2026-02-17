const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    organicInputType: {
      type: String,
      default: "",
    },
    quantityInKgPerAcre: {
      type: Number,
    },
    dataOfApplication: {
      type: String,
      default: "",
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
    },
    updatedById: {
      type: String,
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
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret._id;
      },
    },
    timestamps: true,
  },
);

module.exports = mongoose.model("OrganicInputs", schema);
