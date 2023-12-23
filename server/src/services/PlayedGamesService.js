const GameModel = require('../models/GameModel')
const ApiError = require('./../common/apiErrors')
const UserModel = require('../models/UserModel')
const { ObjectId } = require('mongodb')

class PlayedGamesService {
    getGamesList = async (id, { offset, limit, sort, filters }) => {
        const cursor = await GameModel.find({ 'gameState.users': { $elemMatch: { id } } }).skip(limit * offset).limit(limit)

        return {
            list: cursor,
            count: cursor.length
        }
    }
    
    save = async ({}) => {
        
    }

    getGameData = async (id, userId, accessKey) => {
        try {
            let game

            try {
                game = await GameModel.findById(id)
            } catch (e) {
                throw ApiError.NotFound()
            }

            if (!game) {
                throw ApiError.NotFound()
            }
          
            const usersId = game.teams.map(t => t.users.map(u => u._id)).flat()

            const hasNotAccess = game.type === 'private' && (accessKey !== game.access || !usersId.includes(userId))
            
            if (hasNotAccess) {
                throw ApiError.Forbidden()
            }

            const users = await UserModel.find(usersId.map(id => ({ _id: ObjectId(id) })))

            game.teams = game.teams.map(team => ({
                ...team, 
                users: team.users.map(id => {
                    const userData = users.find(user => user._id === id) || {}
                    return {
                        _id: id,
                        ...userData                        
                    }
                })
            }))

            return game

        } catch (e) {
            throw e
        }
    }
}

module.exports = new PlayedGamesService()


