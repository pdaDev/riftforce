const dotenv = require("dotenv")
dotenv.config()
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const userRouter = require("./src/routers/userRouter")
const roomRouter = require("./src/routers/roomRouter")
const playedGamesRouter = require("./src/routers/playedGamesRouter")
const util = require("util")
const errors = require("./src/middlewares/ErrorsMiddleware")
const {
    connectToRoom,
    changeReadyStatus,
    editRoom,
    leaveUserFromTeam: leaveTeam,
    banUserForRoom,
    kickUserByEmail,
    removeAdministrator,
    addAdministrator,
    getRoom,
    setStage,
} = require("./src/services/RoomService")
const {
    createGameSessionState,
    saveStartDateForGameProcess,
    saveLog,
    saveDataForGameEnd,
} = require("./src/services/GameService")
const ApiError = require("./src/common/apiErrors")
const UserModel = require("./src/models/UserModel")
const UserDTO = require("./src/dtos/userDto")
const PORT = process.env.PORT

const BASE_URL = "/api/v1"

const app = express()
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(BASE_URL + "/auth", userRouter)
app.use(BASE_URL + "/games", playedGamesRouter)
app.use(BASE_URL + "/rooms", roomRouter)
app.use(errors)

const server = require("http").createServer(app)
const io = require("socket.io")(3320, {
    cors: { origin: ["http://localhost:5173"], methods: ["GET", "POST"] },
})

const DB_NAME = "db1"

const DB_HOSTS = ["rc1c-7k6rzse6urhdtirv.mdb.yandexcloud.net:27018"]

const DB_USER = "user1"
const DB_PASS = "12345678"
const CACERT = "/home/<домашняя директория>/.mongodb/root.crt"

const url = util.format(
    "mongodb://%s:%s@%s/",
    DB_USER,
    DB_PASS,
    DB_HOSTS.join(",")
)

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsCAFile: CACERT,
    authSource: DB_NAME,
}

const start = async () => {
    try {
        mongoose.connect("mongodb://localhost:27017/riftforce")
        // await mongoose.connect(url, options)
        server.listen(PORT, (err) =>
            err
                ? console.log(err)
                : console.log(`Server was started at port ${PORT}`)
        )
    } catch (e) {
        console.log("sdfsf")
    }
}

const operateSocketErrors = async (operationCallback, errorHandler) => {
    try {
        await operationCallback()
        errorHandler({ status: "success" })
    } catch (e) {
        console.log(e)
        errorHandler({ status: "error", message: e.message })
    }
}

const WEBSOCKET_EVENTS = {
    connect: "connect",
    disconnect: "disconnect",
    error: "connect-error",
    kick: "kick",
    changeAdmins: "admins-change",
    joinTeam: "join-team",
    leaveTeam: "leave-team",
    joinRoom: "join-room",
    changeReadyStatus: "change-ready",
    editRoomProps: "edit-room-props",
    logAction: "log-action",
    startStage: "start-stage",
    togglePause: "pause",
    sendMessage: "send-message",
}

io.use(async (socket, next) => {
    if (socket.handshake.auth.token) {
        const room = socket.handshake.auth.room
        const user = await UserModel.findById(socket.handshake.auth.token)
        socket.userData = new UserDTO(user)
        socket.join(room)
        socket.roomId = room
        next()
    } else {
        next(ApiError.Unauthorized())
    }
})

const getUserFromSocket = (socket) => socket.userData
const getRoomFromSocket = (socket) => socket.roomId
const getRoomAndUserDataFromSocket = (socket) => ({
    userId: getUserFromSocket(socket).id,
    roomId: getRoomFromSocket(socket),
})

io.on("connection", (socket) => {
    console.log(`user ${socket.userData.name} connected`)

    socket.on(WEBSOCKET_EVENTS.joinRoom, (roomId) => {
        console.log(`${socket.userData.name} joined to room ${roomId}`)
        socket.join(roomId)
        socket.roomId = roomId
    })

    socket.on(WEBSOCKET_EVENTS.joinTeam, async (teamId, cb) => {
        operateSocketErrors(async () => {
            const { userId, roomId } = getRoomAndUserDataFromSocket(socket)
            console.log("try to join")
            await connectToRoom(roomId, userId, { team: teamId })
            socket.broadcast
                .to(roomId)
                .emit(WEBSOCKET_EVENTS.joinTeam, socket.userData, teamId)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.changeAdmins, async (email, reverse, cb) => {
        operateSocketErrors(async () => {
            const { userId, roomId } = getRoomAndUserDataFromSocket(socket)
            if (reverse) {
                await removeAdministrator(ownerId, roomId, email)
            } else {
                await addAdministrator(ownerId, roomId, email)
            }
            socket.broadcast
                .to(roomId)
                .emit(WEBSOCKET_EVENTS.changeAdmins, email, reverse)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.kick, async (email, withBan, cb) => {
        operateSocketErrors(async () => {
            const { userId: ownerId, roomId } =
                getRoomAndUserDataFromSocket(socket)
            await kickUserByEmail(ownerId, roomId, email)

            if (withBan) {
                await banUserForRoom(ownerId, roomId, email)
            }

            socket.broadcast.to(roomId).emit(WEBSOCKET_EVENTS.kick, email)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.leaveTeam, async (cb) => {
        operateSocketErrors(async () => {
            const { userId, roomId } = getRoomAndUserDataFromSocket(socket)
            await leaveTeam(roomId, userId)
            socket.broadcast.to(roomId).emit(WEBSOCKET_EVENTS.leaveTeam, userId)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.changeReadyStatus, async (status, cb) => {
        operateSocketErrors(async () => {
            const { userId, roomId } = getRoomAndUserDataFromSocket(socket)
            await changeReadyStatus(roomId, userId, status)
            socket.broadcast
                .to(roomId)
                .emit(WEBSOCKET_EVENTS.changeReadyStatus, userId, status)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.sendMessage, async (message, cb) => {
        operateSocketErrors(async () => {
            const { roomId } = getRoomAndUserDataFromSocket(socket)
            socket.broadcast
                .to(roomId)
                .emit(WEBSOCKET_EVENTS.sendMessage, message)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.editRoomProps, async (payload, cb) => {
        operateSocketErrors(async () => {
            const { userId, roomId } = getRoomAndUserDataFromSocket(socket)
            await editRoom(roomId, userId, payload)
            socket.broadcast
                .to(roomId)
                .emit(WEBSOCKET_EVENTS.changeReadyStatus, payload, cb)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.logAction, async (log, cb) => {
        operateSocketErrors(async () => {
            const roomId = getRoomFromSocket(socket)
            await saveLog(roomId, log)
            socket.broadcast.to(roomId).emit(WEBSOCKET_EVENTS.logAction, log)
        }, cb)
    })

    socket.on(WEBSOCKET_EVENTS.startStage, async (stage, payload, cb) => {
        operateSocketErrors(async () => {
            const roomId = getRoomFromSocket(socket)
            const { teams, guilds, logs } = payload

            if (stage === "END") {
                const winner = teams.reduce(
                    (acc, team) => {
                        if (team.points > acc.maxPoints) {
                            return {
                                winner: team,
                                maxPoints: team.points,
                            }
                        }
                    },
                    { winner: "", maxPoints: 0 }
                ).winner

                await saveDataForGameEnd(roomId, winner.id, logs)
                await setStage(roomId, "ROOM")
                socket.broadcast
                    .to(roomId)
                    .emit(WEBSOCKET_EVENTS.startStage, stage, {
                        team: winner,
                        points: 0,
                    })
            }

            if (stage === "DRAFT") {
                await createGameSessionState(roomId, teams, guilds)
                await setStage(roomId, stage)
            }

            if (stage === "GAME_PROCESS") {
                await saveStartDateForGameProcess(roomId, teams)
                await setStage(roomId, stage)
            }

            const room = await getRoom(roomId, socket.userData.email)
            socket.broadcast
                .to(roomId)
                .emit(WEBSOCKET_EVENTS.startStage, stage, room)
        }, cb)
    })
})

start()
