const mongoose = require('mongoose')

const TempSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        trim: true
    },

    username: {
        type: String,
        required: true,
        trim: true,
        default: 'N',
    },

    password: {
        type: String,
        required: true
    },

    verificationCode: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
        expires: 1800
    } // 1800 seconds (30 minutes)
})

const Temp = mongoose.model('Temp', TempSchema)
module.exports = Temp