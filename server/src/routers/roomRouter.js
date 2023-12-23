const { Router, urlencoded } = require("express")
const {
    createRoom,
    saveRoom,
    undoSaveRoom,
    getRoom,
    getRooms,
    editRoom,
    connectToRoom,
    undoBanUser,
    saveGameState,
} = require("./../ocntrollers/RoomController")
const authed = require("../middlewares/AuthedReuqestsMiddleware")
const { getGameState, setGameSessionState } = require("../services/GameService")

const roomRouter = new Router()

roomRouter.post("/", authed, createRoom)
roomRouter.patch("/:id", authed, editRoom)
roomRouter.get("/", authed, getRooms)
roomRouter.get("/:id", authed, getRoom)
roomRouter.post("/:id", authed, connectToRoom)
roomRouter.get("/:id/save", authed, saveRoom)
roomRouter.delete("/:id/save", authed, undoSaveRoom)
roomRouter.get("/:id/game-state", authed, getGameState)
roomRouter.post("/:id/game-state", authed, saveGameState)
roomRouter.delete("/:id/blackList/:email", authed, undoBanUser)

module.exports = roomRouter
