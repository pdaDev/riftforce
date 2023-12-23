const UserDTO = require("./userDto")

class AuthUserDTO extends UserDTO {
    constructor(model) {
        super(model)
        this.isActivated = model.isActivated
        this.isAdmin = model.isAdmin
    }
}

module.exports = AuthUserDTO