const mongoose = require('mongoose');

const schema = new mongoose.Schema({

    id: { type: String, required:true },
    name: {
        type: String,
        required: true,
        unique: true,
    },

    status: {
        type: Boolean,
        default: true,
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

module.exports = mongoose.model('Chemicals', schema);
