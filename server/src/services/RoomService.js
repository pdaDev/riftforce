const RoomModel = require("../models/RoomModel")
const { hash, compare } = require("bcrypt")
const { v4: uuid } = require("uuid")
const ApiError = require("../common/apiErrors")
const UserModel = require("../models/UserModel")
const UserDTO = require("../dtos/userDto")
const { getRandomElement } = require("../common/helpers")
const UserService = require("./UserService")
const cli = require("../repositories/cacheStorage")
const RoomDTO = require("../dtos/roomDTO")
const { ObjectId } = require("mongodb")
const SessionModel = require("../models/SessionModel")

class RoomService {
    _getRoomUserState = (user, ready = false, type = "PLAYER") => {
        return {
            ...new UserDTO(user),
            ready,
            type,
        }
    }

    createRoom = async (userId, payload) => {
        try {
            const user = await UserModel.findById(userId)

            if (!user) {
                throw ApiError.BadRequest()
            }

            const {
                playersCount,
                withExtension,
                name,
                password,
                draftStages,
                type,
            } = payload
            const passwordForSave = password ? await hash(password, 3) : null

            const room = await RoomModel.create({
                owner: userId,
                teams: [
                    {
                        users: [this._getRoomUserState(user, true, "OWNER")],
                    },
                    {
                        users: [],
                    },
                ],
                date: Date.now(),
                roomState: {
                    name,
                    type,
                    password: passwordForSave,
                    props: {
                        withExtension,
                        playersCount,
                        draftStages,
                    },
                },
            })

            // this.createRoomCache(room)

            return room._id
        } catch (e) {
            throw e
        }
    }

    _getRoomCacheData = () => {
        return new Promise()
    }

    createRoomCache = async ({ _id, teams, roomState, stage, owner }) => {
        cli.hSet(_id, "gameState", JSON.stringify({ teams }))
        cli.hSet(
            _id,
            "generalState",
            JSON.stringify({
                owner,
                bigDaddy: owner,
            })
        )
        cli.hSet(_id, "stage", stage)
        cli.hSet(_id, "roomState", JSON.stringify(roomState))
    }

    changeRoomCache = async ({ _id, teams, roomState }) => {
        cli.hSet(_id, "gameState", JSON.stringify({ teams }))
        cli.hSet(_id, "roomState", JSON.stringify(roomState))
    }

    _getRoomModel = async (id) => {
        try {
            const room = await RoomModel.findById(id)

            if (!room) {
                throw ApiError.NotFound()
            }

            return room
        } catch (e) {
            throw e
        }
    }

    getRoomFromCache = async (id) => {
        try {
            const room = await cli.hGetAll(id)

            if (room && Object.keys(room).length > 0) {
                return room
            }

            return null
        } catch (e) {
            throw e
        }
    }

    getRoom = async (id, email) => {
        try {
            let room =
                (await this.getRoomFromCache(id)) ||
                new RoomDTO(await this._getRoomModel(id), email)

            const hasNotAccess =
                (room.roomState.type === "PRIVATE" &&
                    !room.gameState.teams.some((t) =>
                        t.users.some((u) => u.email === email)
                    )) ||
                room.roomState.blackList.includes(email)

            if (hasNotAccess) {
                throw ApiError.Forbidden()
            }

            if (["DRAFT", "GAME_PROCESS"].includes(room.stage)) {
                const session = await SessionModel.findOne({ roomId: id })
                return {
                    ...room,
                    gameState: {
                        teams: session.teams,
                        guilds: session.guilds,
                        logs: session.logs,
                        turnIndex: session.turnIndex,
                    },
                }
            }

            return room
        } catch (e) {
            throw e
        }
    }

    setStage = async (roomId, stage) => {
        try {
            const room = await this._getRoomModel(roomId)
            await room.updateOne({ $set: { stage } })
        } catch (e) {
            throw e
        }
    }

    leaveUserFromTeam = async (roomId, userId) => {
        try {
            const room = await this._getRoomModel(roomId)
            const userTeam = room.teams.find(({ users }) =>
                users.some(({ id }) => id === userId)
            )

            if (!userTeam) {
                throw ApiError.Forbidden()
            }

            const teamIndex = room.teams.indexOf(userTeam)
            console.log(teamIndex)

            if (teamIndex > -1) {
                await room.updateOne({
                    $inc: { currentUsersCount: -1 },
                    $pull: { [`teams.${teamIndex}.users`]: { id: userId } },
                })
            }

            // this.changeRoomCache(room)
        } catch (e) {
            throw e
        }
    }

    kickUserByEmail = async (ownerId, roomId, email) => {
        try {
            const room = await this._getRoomModel(roomId)
            const userTeam = room.teams.find(({ users }) =>
                users.some((user) => user.email === email)
            )

            if (!userTeam) {
                throw ApiError.BadRequest()
            }

            if (room.owner !== ownerId) {
                throw ApiError.Forbidden()
            }

            const teamIndex = room.teams.indexOf(userTeam)

            if (teamIndex > -1) {
                await room.updateOne({
                    $inc: { currentUsersCount: -1 },
                    $pull: { [`teams.${teamIndex}.users`]: { email: email } },
                })
            }
            // this.changeRoomCache(room)
        } catch (e) {
            throw e
        }
    }

    getRooms = async (
        { email },
        { offset, limit, sort, filters, user, active }
    ) => {
        try {
            const filterByStage = active
                ? active === 1
                    ? { stage: { $in: ["DRAFT", "GAME_PROCESS"] } }
                    : { stage: "ROOM" }
                : {}
            const filterByUserCount =
                filters?.showFull == 1
                    ? {}
                    : {
                          $where: "this.currentUsersCount < this.roomState.props.playersCount",
                      }
            const filterWithExtension = filters?.withExtension
                ? {
                      "roomState.props.withExtension": Boolean(
                          +filters.withExtension
                      ),
                  }
                : {}
            const filterWithBan = filters?.withBan
                ? Boolean(+filters.withBan)
                    ? {
                          "roomState.props.draftStages": {
                              $elemMatch: { $eq: "BAN" },
                          },
                      }
                    : {
                          "roomState.props.draftStages": {
                              $not: { $elemMatch: { $eq: "BAN" } },
                          },
                      }
                : {}
            const filterByPlayersCount = filters?.playersCount
                ? Array.isArray(filters.playersCount)
                    ? {
                          "roomState.props.playersCount": {
                              $in: filters.playersCount.map(Number),
                          },
                      }
                    : { "roomState.props.playersCount": filters.playersCount }
                : {}

            // ...filterByStage,
            // ...filterByUserCount,
            // ...filterWithExtension,
            // ...filterWithBan,
            // ...filterByPlayersCount,

            const userFilters = user
                ? {
                      teams: {
                          $elemMatch: { users: { $elemMatch: { id: user } } },
                      },
                  }
                : {}
            const data = await RoomModel.find({
                ...userFilters,
                ...filterByStage,
            })
                .sort(sort || "date")
                .skip(limit * offset)
                .limit(limit)

            return {
                list: data,
                count: data.length,
            }
        } catch (e) {
            throw e
        }
    }

    changeReadyStatus = async (roomId, userId, status) => {
        try {
            const room = await this._getRoomModel(roomId)
            const userTeam = room.teams.find(({ users }) =>
                users.some(({ id }) => id === userId)
            )

            if (!userTeam) {
                throw ApiError.Forbidden()
            }

            const teamIndex = room.teams.indexOf(userTeam)
            const userIndex = userTeam.users.indexOf(
                userTeam.users.find((u) => u.id === userId)
            )

            if (userIndex > -1 && teamIndex > -1) {
                await room.updateOne({
                    $set: {
                        [`teams.${teamIndex}.users.${userIndex}.ready`]: status,
                    },
                })
            }
        } catch (e) {
            throw e
        }
    }

    connectToRoom = async (roomId, userId, { password, team }) => {
        try {
            const room = await this._getRoomModel(roomId)
            const user = await UserService.getUser(userId)

            if (room.roomState.type === "PRIVATE") {
                if (!password) {
                    throw ApiError.BadRequest("Отстуствует пароль")
                }

                const isAlreadyJoined = room.teams.some((team) =>
                    team.users.some((user) => user.id === userId)
                )

                if (!isAlreadyJoined) {
                    const isPasswordEqual = await compare(
                        password,
                        room.roomState.password
                    )

                    if (!isPasswordEqual) {
                        throw ApiError.BadRequest("Пароли не совпадают")
                    }
                }
            }

            if (room.blackList.includes(userId)) {
                throw ApiError.Forbidden("Бан нахуй")
            }

            const maxPlayerPerTeam = Math.ceil(
                room.roomState.props.playersCount / 2
            )
            const freeTeams = room.teams
                .filter(({ users }) => users.length < maxPlayerPerTeam)
                .map((team) => team._id.toString())

            const canConnectToAnyTeam =
                room.currentUsersCount !== room.roomState.props.playersCount &&
                freeTeams.length > 0

            if (!canConnectToAnyTeam) {
                throw ApiError.Forbidden("Комната заполнена")
            }

            const teamIsFree = team && freeTeams.includes(team)

            if (team && !teamIsFree) {
                throw ApiError.Forbidden("Команда уже заполнена")
            }

            const teamForJoin = team || getRandomElement(freeTeams)
            const teamIndex = room.teams
                .map((team) => team._id.toString())
                .indexOf(teamForJoin)

            if (teamIndex > -1) {
                await room.updateOne({
                    $inc: { currentUsersCount: 1 },
                    $push: {
                        [`teams.${teamIndex}.users`]:
                            this._getRoomUserState(user),
                    },
                })
                // this.changeRoomCache(room)
            }
        } catch (e) {
            throw e
        }
    }

    _hasOwnerAccess = (room, ownerId) => {
        if (room.owner !== ownerId) {
            throw ApiError.Forbidden()
        }
    }

    _pullFromRoomListPropWithOwnerAccess = async (
        key,
        ownerId,
        roomId,
        obj
    ) => {
        try {
            const room = await this._getRoomModel(roomId)
            this._hasOwnerAccess(room, ownerId)

            await room.updateOne({
                $pull: { [key]: obj },
            })
        } catch (e) {
            throw e
        }
    }

    _addToRoomListPropWithOwnerAccess = async (key, ownerId, roomId, obj) => {
        try {
            const room = await this._getRoomModel(roomId)
            this._hasOwnerAccess(room, ownerId)

            await room.updateOne({
                $pull: { blackList: obj },
            })
        } catch (e) {
            throw e
        }
    }

    undoBanUserForRoom = async (ownerId, roomId, email) => {
        await this._pullFromRoomListPropWithOwnerAccess(
            "blackList",
            ownerId,
            roomId,
            email
        )
    }

    banUserForRoom = async (ownerId, roomId, email) => {
        await this._addToRoomListPropWithOwnerAccess(
            "blackList",
            ownerId,
            roomId,
            email
        )
    }

    addAdministrator = async (ownerId, roomId, email) => {
        this._addToRoomListPropWithOwnerAccess(
            "administrators",
            ownerId,
            roomId,
            email
        )
    }

    removeAdministrator = async (ownerId, roomId, email) => {
        await this._pullFromRoomListPropWithOwnerAccess(
            "administrators",
            ownerId,
            roomId,
            email
        )
    }

    undoSaveRoomForUser = async (roomId, email) => {
        try {
            try {
                await RoomModel.findByIdAndUpdate(roomId, {
                    $pull: { saved: email },
                })
            } catch (e) {
                throw e
            }
        } catch (e) {
            throw e
        }
    }

    saveRoomForUser = async (roomId, email) => {
        try {
            await RoomModel.findByIdAndUpdate(roomId, {
                $push: { saved: email },
            })
        } catch (e) {
            throw e
        }
    }

    editRoom = async (id, userId, payload) => {
        try {
            const {
                playersCount,
                withExtension,
                name,
                password,
                draftStages,
                type,
            } = payload
            const room = await this._getRoomModel(id)

            this._hasOwnerAccess(room, userId)

            const passwordForSave =
                password !== undefined
                    ? password !== null
                        ? hash(password, 3)
                        : null
                    : room.roomState.password

            room = await room.updateOne({
                $set: {
                    "roomState.name": name || room.roomState.name,
                    "roomState.type": type || room.roomState.type,
                    "roomState.password": passwordForSave,
                    "roomState.props.withExtension":
                        withExtension ?? room.roomState.props.withExtension,
                    "roomState.props.draftStages":
                        draftStages || room.roomState.props.draftStages,
                    "roomState.props.playersCount":
                        playersCount || room.roomState.props.playersCount,
                },
            })

            // this.changeRoomCache(room)
        } catch (e) {
            throw e
        }
    }
}

module.exports = new RoomService()
