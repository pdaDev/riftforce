const ApiError = require("../common/apiErrors")
const GameModel = require("../models/GameModel")
const cli = require("../repositories/cacheStorage")
const RoomModel = require("../models/RoomModel")
const SessionModel = require("../models/SessionModel")

class GameService {
    createAndSaveGameSessionForDraft = async (roomId, teams, guilds) => {
        try {
            const room = await RoomModel.findById(roomId)
            const draftConfig = room.roomState.props

            const data = await GameModel.create({
                teams: teams.map((team) => ({
                    id: team.id,
                    name: team.name,
                    users: team.users.map((user) => user.id),
                })),
                startState: {
                    draftConfig,
                    guilds,
                    users: teams
                        .map((team) => team.users)
                        .flat()
                        .map((user) => ({
                            id: user.id,
                            draft: user.draft,
                            cards: [],
                            fields: [],
                        })),
                    logs: [],
                },
                duration: 0,
                date: Date.now(),
            })

            return {
                id: data._id,
                date: data.date,
            }
        } catch (e) {
            throw e
        }
    }

    _getGameModel = async (id) => {
        try {
            return await GameModel.findById(id)
        } catch (e) {
            throw ApiError.NotFound()
        }
    }

    saveGameSessionForGameProcess = async (id, teams) => {
        try {
            let game = await this._getGameModel(id)

            const newUsersState = teams
                .map((team) => team.users)
                .flat()
                .map(({ id, draft, cards, fields }) => ({
                    id,
                    draft,
                    cards,
                    fields,
                }))

            await game.updateOne({
                $set: { "startState.users": newUsersState },
            })
        } catch (e) {
            throw e
        }
    }

    _getSessionId = async (roomId, cb) => {
        // return new Promise((res, rej) => {
        //     cli.hGet(roomId, 'gameSessionId', async (err, id) => {
        //         if (err) {
        //             rej(err)
        //         }

        //         try {
        //             await cb(id)
        //             res()
        //         } catch (e) {
        //             rej(e)
        //         }
        //     })
        // })
        return await SessionModel.findOne({ roomId })
    }

    saveStartDateForGameProcess = async (roomId, teams) => {
        try {
            const session = await SessionModel.findOne({ roomId })
            await session.updateOne({ teams })
            await this.saveGameSessionForGameProcess(session.id, teams)
        } catch (e) {
            throw e
        }
        // return this._getSessionId(roomId, async (id) => {
        //     await this.saveGameSessionForGameProcess(id, teams)
        // })
    }

    saveDataForGameEnd = async (roomId, winner, logs) => {
        try {
            const session = await SessionModel.findOne({ roomId })
            await this.saveWinnerForGameProcess(session.id, winner, 0, logs)
        } catch (e) {
            throw e
        }
        // return this._getSessionId(roomId, async (id) => {
        //     await this.saveWinnerForGameProcess(id, winner, duration, logs)
        // })
    }

    saveWinnerForGameProcess = async (id, winner, duration, logs) => {
        try {
            const game = await this._getGameModel(id)
            await game.updateOne({
                $set: { "startState.logs": logs, duration, winner },
            })
        } catch (e) {
            throw e
        }
    }

    createGameSessionState = async (id, teams, guilds) => {
        // try {
        //     const { id:  sessionId, date } = await this.createAndSaveGameSessionForDraft(id, teams, guilds)
        //     cli.hSet(id, 'time', JSON.stringify({
        //         paused: false,
        //         periodStart: date,
        //         currentDuration: 0
        //     }))
        //     cli.hSet(id, 'stage', 'GAME_PROCESS')
        //     cli.hSet(id, 'gameSessionId', sessionId)
        //     cli.hSet(id, 'gameState', JSON.stringify({
        //         teams, guilds, logs: []
        //     }))
        // } catch (e) {
        //     throw e
        // }
        try {
            const { id: sessionId, date } =
                await this.createAndSaveGameSessionForDraft(id, teams, guilds)

            SessionModel.create({
                id: sessionId,
                roomId: id,
                time: {
                    paused: false,
                    periodStart: Date.now(),
                    currentDuration: 0,
                },
                logs: [],
                guilds,
                teams,
            })
        } catch (e) {
            throw e
        }
    }

    setGameSessionState = async (id, payload) => {
        // cli.hSet(id, 'gameState', JSON.stringify({
        //     teams, guilds, logs
        // }))
        try {
            const { teams, guilds, turnIndex } = payload
            await SessionModel.findOneAndUpdate(
                { roomId: id },
                {
                    $set: {
                        teams,
                        guilds,
                        turnIndex,
                    },
                }
            )
        } catch (e) {
            throw e
        }
    }

    saveLog = async (roomId, log) => {
        try {
            await SessionModel.findOneAndUpdate(
                { roomId },
                {
                    $push: { logs: log },
                }
            )
        } catch (e) {
            throw e
        }
    }

    getGameState = async (id) => {
        return new Promise((res, rej) => {
            cli.hGet(id, "gameState", (gameStateError, gameState) => {
                if (gameStateError) {
                    rej(gameStateError)
                }

                res(gameState)
            })
        })
    }
}

module.exports = new GameService()
