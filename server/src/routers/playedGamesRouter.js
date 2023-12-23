const { Router, urlencoded } = require("express")
const {  getGameData, getMyPlayedGamesList } = require('./../ocntrollers/PlayedGamesController')
const authed = require('../middlewares/AuthedReuqestsMiddleware')

const playedGamesRouter = new Router()

playedGamesRouter.get('/me', authed, getMyPlayedGamesList)
playedGamesRouter.get('/:id', getGameData)

module.exports = playedGamesRouter