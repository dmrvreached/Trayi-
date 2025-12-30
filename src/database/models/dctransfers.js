const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    dc_transfer_from_id: { type: String, required: true },
    dc_transfer_to_id: { type: String, required: true },
    dc_transfer_from_name: { type: String, required: true },
    dc_transfer_to_name: { type: String, required: true },
    dc_transfer_from_phone_number : { type: String, required: true },
    dc_transfer_to_phone_number : { type: String, required: true },
    dc_transfer_from_email : { type: String, required: true },
    dc_transfer_to_email : { type: String, required: true },
    status: { type: Boolean, default: true },
    addedByName: {
        type: String,
    },
    addedById: {
        type: String,
    },
    updatedByName: {
        type: String,
    },
    updatedById: {
        type: String,
    },

}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('dctransfers', schema);
