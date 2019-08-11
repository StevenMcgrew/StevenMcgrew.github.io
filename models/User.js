const mongoose = require('mongoose')
const timestamps = require('mongoose-timestamp')

const UserSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true
    },

    appData: {

        username: {
            type: String,
            required: true,
            trim: true,
            default: 'N'
        },

        isDarkMode: {
            type: Boolean,
            default: false
        }
    }

})

UserSchema.plugin(timestamps);
const User = mongoose.model('User', UserSchema)
module.exports = User