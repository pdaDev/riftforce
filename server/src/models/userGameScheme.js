const { Schema }  = require('mongoose')

const userGameScheme = new Schema({
    id: String,
    cards: {
        hand: [String],
        left: [String],
        deck: [String]
    },
    fields: [[String]],
    draft: {
        picks: [String],
        bans: [String]
    }
})

module.exports = userGameScheme