class UserEditDTO {
    constructor(req) {
        this.name = req.body.name
        const avatarFiles =req.files['avatar']
        this.avatar = avatarFiles ? avatarFiles[0] : undefined
    }
}

module.exports = UserEditDTO