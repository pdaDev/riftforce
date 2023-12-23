const GameListItemDTO = require('./gameListItemDTO')
const UserDTO = require('./userDto')

class GameDTO extends GameListItemDTO {
    constructor(model) {
        super(model)
        this.teams = model.teams(team => ({
            ...team,
            users: team.users.map(user => new UserDTO(user))
        }))
        this.startState = model.startState
    }
}

module.exports = GameDTO