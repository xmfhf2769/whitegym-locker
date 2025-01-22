const mongoose = require('mongoose');

const cancelledMemberSchema = new mongoose.Schema({
    memberName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    previousLockerNumber: {
        type: Number,
        required: true
    },
    cancellationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CancelledMember', cancelledMemberSchema);