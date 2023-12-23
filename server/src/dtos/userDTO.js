class  UserDTO {
    constructor(model) {
        this.id = model?.id || model._id 
        this.name = model.name
        this.email = model.email
        this.avatar = model.avatar
        this.rating = model.rating
        this.ready = model?.ready
        this.type = model?.type || 'PLAYER'
    }
}

module.exports = UserDTO