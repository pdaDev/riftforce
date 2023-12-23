const RoomListItemDTO = require("./roomListItemDTO")
const UserDTO = require("./userDto")

class RoomDTO {
    constructor(model, email) {
        this.gameState = {
            teams: model.teams.map(({ _id, name, users }) => ({
                id: _id,
                name,
                users: users.map((user) => new UserDTO(user)),
            })),
            guilds: [],
            logs: [],
            turnIndex: 0,
        }
        ;(this.roomState = {
            ...model.roomState,
            saved: email ? model.saved.includes(email) : false,
            administrators: model.administrators,
            blackList: model.blackList,
        }),
            (this.stage = model.stage),
            (this.generalState = {
                owner: model.owner,
                bigDaddy: model.owner,
            })
    }
}

module.exports = RoomDTO
