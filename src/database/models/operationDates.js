
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
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
        default: ''
    },
    updatedById: {
        type: String,
        default: ''
    },
    farmerId: {
        type: String,
        required: true,
    },
    plotId: {
        type: String,
        required: true,
    },
    seasonId: {
        type: String,
        required: true,
    },
    dateArray: [
        {
            popId: {type: String,default: ''},
            popName: {
                type: String,
                default: '',
            },
            date: {
                type: String,
                default: '',
            },
            activities: {
                type: String,
                default: '',
            }
        }
    ]
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret._id;
        },
    },
    timestamps: true,
});
module.exports = mongoose.model('OperationDates', schema);
