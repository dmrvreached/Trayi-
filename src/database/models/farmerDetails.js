const e = require("cors");
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    addedByName: {
      type: String,
      required: true,
    },
    addedById: {
      type: String,
      required: true,
    },
    updatedByName: {
      type: String,
      default: "",
    },
    updatedById: {
      type: String,
      default: "",
    },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    dcId: { type: String, required: true },
    dcName: { type: String, required: true },
    dateOfRegistration: {
      type: String,
      default: "",
    },
    farmerName: {
      type: String,
      default: "",
    },
    farmerCode: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      default: "",
    },
    villageCode: {
      type: String,
      default: "",
    },
    villageName: {
      type: String,
      default: "",
    },
    villageId: {
      type: String,
      default: "",
    },
    stateName: {
      type: String,
      default: "",
    },
    aadhaarNumber: {
      type: String,
      default: "",
      length: 12,
      unique: true,
    },
    aadhaarPhoto: {
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
    },
    stateId: {
      type: String,
      default: "",
    },
    districtId: {
      type: String,
      default: "",
    },
    districtName: {
      type: String,
      default: "",
    },
    blockId: {
      type: String,
      default: "",
    },
    blockName: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      default: "",
    },
    farmerMobile: {
      type: String,
      default: "",
    },
    isOwner: {
      type: Boolean,
      default: true,
    },
    ownerName: {
      type: String,
      default: "",
    },
    lesseMobile: {
      type: String,
      default: "",
    },
    lesseExpiryDate: {
      type: String,
      default: "",
    },
    lesseAgreementPhoto: {
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
    },
    otp: { type: Number, default: 1234 },
    phoneVerification: { type: Boolean, default: false },
    isTermsAccepted: { type: Boolean, default: false },
    consent_accept_terms_conditions: { type: Boolean, default: false },
    farmer_accept_terms_conditions: { type: Boolean, default: false },
    consent_document: {
      originalName: { type: String, default: "" },
      blobName: { type: String, default: "" },
      url: { type: String, default: "" },
      timeStamp: { type: String, default: "" },
      coords: { type: Array, default: "" },
    },
    farmer_agreement_url: {
      type: String,
      default: "",
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret._id;
        delete ret.otp;
        delete ret.phoneVerification;
      },
    },
    timestamps: true,
  },
);
module.exports = mongoose.model("Farmerdetails", schema);
