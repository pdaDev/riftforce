
class GameListItemDTO {
    constructor(model) {
        this.id = model._id
        this.winner = model.winner
        this.duration = model.duration
        this.type = model.type
        this.date = model.data
    }
}


module.exports = GameListItemDTO