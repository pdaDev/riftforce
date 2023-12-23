const {
    createRoom,
    getRoom,
    saveRoomForUser,
    undoSaveRoomForUser,
    getRooms,
    editRoom,
    connectToRoom,
    undoBanUserForRoom,
} = require("../services/RoomService")
const RoomPayloadDTO = require("../dtos/roomPropsPayloadDTO")
const ListPayloadDTO = require("../dtos/listPayloadDTO")
const RoomListItemDTO = require("../dtos/roomListItemDTO")
const RoomDTO = require("../dtos/roomDTO")
const ConnectToRoomPayloadDTO = require("../dtos/connectToRoomPayloadDTO")
const { SUCCESS_RESULT_RESPONSE } = require("../common/constants")
const { setGameSessionState } = require("../services/GameService")

class RoomController {
    createRoom = async (req, res, next) => {
        try {
            const id = await createRoom(
                req.userData.id,
                new RoomPayloadDTO(req)
            )
            res.json(id)
        } catch (e) {
            next(e)
        }
    }

    getRooms = async (req, res, next) => {
        try {
            const { list, ...data } = await getRooms(
                req.userData,
                new ListPayloadDTO(req)
            )
            res.json({
                ...data,
                list: list.map((el) => new RoomListItemDTO(el)),
            })
        } catch (e) {
            next(e)
        }
    }

    getRoom = async (req, res, next) => {
        try {
            const data = await getRoom(req.params.id, req.userData.email)
            res.json(data)
        } catch (e) {
            next(e)
        }
    }

    editRoom = async (req, res, next) => {
        try {
            await editRoom(
                req.params.id,
                req.userData.id,
                new RoomPayloadDTO(req)
            )
            res.json(SUCCESS_RESULT_RESPONSE)
        } catch (e) {
            next(e)
        }
    }

    undoBanUser = async (req, res, next) => {
        console.log("sdfsdfdsf")
        try {
            console.log(req.params + "sdf")
            await undoBanUserForRoom(
                req.userData.id,
                req.params.id,
                req.params.email
            )
            res.json(SUCCESS_RESULT_RESPONSE)
        } catch (e) {
            next(e)
        }
    }

    connectToRoom = async (req, res, next) => {
        try {
            await connectToRoom(
                req.params.id,
                req.userData.id,
                new ConnectToRoomPayloadDTO(req)
            )
            res.status(200).json(SUCCESS_RESULT_RESPONSE)
        } catch (e) {
            next(e)
        }
    }

    saveRoom = async (req, res, next) => {
        try {
            await saveRoomForUser(req.params.id, req.userData.email)
            res.status(200).json(SUCCESS_RESULT_RESPONSE)
        } catch (e) {
            next(e)
        }
    }

    saveGameState = async (req, res, next) => {
        try {
            await setGameSessionState(req.params.id, req.body)
            res.status(200).json(SUCCESS_RESULT_RESPONSE)
        } catch (e) {
            next(e)
        }
    }

    undoSaveRoom = async (req, res, next) => {
        try {
            await undoSaveRoomForUser(req.params.id, req.userData.email)
            res.status(200).json(SUCCESS_RESULT_RESPONSE)
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new RoomController()
