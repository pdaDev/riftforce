
class RoomPropsPayloadDTO {
    constructor (req) {
        const body = req.body
        this.playersCount = body.playersCount
        this.withExtension = body.withExtension
        this.name = body.name
        this.password = body.password
        this.draftStages = body.draftStages
        this.type = body.type
    }
}

module.exports = RoomPropsPayloadDTO