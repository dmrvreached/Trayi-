const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true, // Only id should be unique
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
      // NO unique constraint here
    },
    plotId: {
      type: String,
      required: true,
    },
    farmerId: {
      type: String,
      required: true,
    },
    irrigation_field_observations: [
      {
        observation_type: {
          type: String,
          required: true,
          enum: ['Dry', 'Wet', 'Water logged']
        },
        date: {
          type: Date,
        },
        photograph: {
          originalName: { type: String, default: "" },
          blobName: { type: String, default: "" },
          url: { type: String, default: "" },
          timeStamp: { type: Date },
          coords: { type: Array, default: [] }
        },
        water_depth_cm: {
          type: Number,
          min: 0,
          default: null
        }
      }
    ]
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
module.exports = mongoose.model("IrrigationFieldObservation", schema);