const ListPayloadDTO = require('../dtos/listPayloadDTO')
const { getGamesList, getGameData } = require('../services/PlayedGamesService')
const GameListItemDTO = require('./../dtos/gameListItemDTO')
const GameDTO = require('./../dtos/gameDTO')


class PlayedGamesController {
    getMyPlayedGamesList = async (req, res, next) => {
        try {
            const data = await getGamesList(req.userData.id, new ListPayloadDTO(req))
            return res.json({
                ...data,
                list: data.list.map(el => new GameListItemDTO(el))
            })
        } catch (e) {
            next(e)
        }
    }

    getGameData = async (req, res, next) => {
        try {
            const data = await getGameData(req.params.id, req.userData?.id, req.query['access'])
            return res.json(new GameDTO(data))
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new PlayedGamesController()