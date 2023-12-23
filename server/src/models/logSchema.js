const { Schema }  = require('mongoose')

const logScheme = new Schema({
    id: String,
    type: String,
    action: String,
    target: { type: String, nullable: true },
    date: String,
    timestamp: {
        type: {
            seconds: Number,
            UTC: String
        },
        required: false,
        default: undefined 
    }
})

module.exports = logScheme