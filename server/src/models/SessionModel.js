const { model, Schema } = require("mongoose")
const logScheme = require("./logSchema")
const userGameScheme = require("./userGameScheme")

const roomSchema = new Schema({
    id: String,
    roomId: String,
    time: {
        paused: Boolean,
        periodStart: Number,
        currentDuration: Number,
    },
    logs: [logScheme],
    guilds: [String],
    turnIndex: { type: Number, default: 0 },
    teams: [
        {
            id: String,
            name: String,
            points: { type: Number, default: 0 },
            users: [
                {
                    name: String,
                    avatar: String,
                    id: String,
                    cards: {
                        hand: [String],
                        left: [String],
                        deck: [String],
                    },
                    fields: [[String]],
                    draft: {
                        picks: [String],
                        bans: [String],
                    },
                },
            ],
        },
    ],
})

module.exports = model("Session", roomSchema)
