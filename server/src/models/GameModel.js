const { model, Schema } = require("mongoose")
const userGameScheme = require("./userGameScheme")
const logScheme = require("./logSchema")

const gameScheme = new Schema({
    winner: { type: String },
    teams: [
        {
            id: { type: String, required: true },
            name: String,
            users: [String],
        },
    ],
    startState: {
        draftConfig: {
            withExtension: Boolean,
            draftTemplates: [String],
        },
        guilds: [String],
        users: [userGameScheme],
        logs: [logScheme],
    },
    duration: { type: Number, required: true },
    date: { type: Number, required: true },
    type: { type: String, default: "public" },
    access: { type: String, nullable: true, default: null },
})

module.exports = model("Game", gameScheme)
