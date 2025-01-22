const mongoose = require('mongoose');

const lockerSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    memberName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    membershipType: {
        type: String,
        enum: ['regular', 'subscription'],
        default: 'regular'
    },
    expirationDate: {
        type: Date
    },
    isCancelled: {
        type: Boolean,
        default: false
    }
});

const Locker = mongoose.model('Locker', lockerSchema);
module.exports = Locker;