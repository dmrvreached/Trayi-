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
        haveYouUsedAmendments: {
      type: Boolean,
      default: false,
    },
    farmerId: {
      type: String,
      required: true,
    },
       amendments_last_3yrs: [
     {
       year: {
         type: Number,
         required: true
       },
       inputs: [
         {
           input_type: {
             type: String,
             required: true,
             enum: ['limestone/dolomite', 'Bichar', 'Gypsum', 'Other']
           },
           quantity: {
             type: Number,
             required: true,
             min: 0
           }
         }
       ]
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
module.exports = mongoose.model("Amendments", schema);
