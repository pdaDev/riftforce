module.exports = class ConnectToRoomPayloadDTO {
    constructor (req) {
        this.password = req.body.password
        this.team = req.body.team
    }
}