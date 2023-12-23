class RoomListItemDTO {
    constructor(model) {
        this.id = model._id
        this.date = model.date
        this.name = model.roomState.name
        this.owner = model.teams
            .map((team) => team.users)
            .flat()
            .find((user) => user.id === model.owner)
        this.type = model.roomState.type
        this.currentUsersCount = model.teams.reduce(
            (acc, team) => acc + team.users.length,
            0
        )
        this.stage = model.stage
        this.props = {
            withExtension: model.roomState.props.withExtension,
            withBan: model.roomState.props.draftStages.includes("BAN"),
            playersCount: model.roomState.props.playersCount,
        }
    }
}

module.exports = RoomListItemDTO
