import { InGameCode, ServerRoomProps, StageCode } from "../../Classes/namespace"
import { RoomType } from "../../shared"

export type ServerRoomCard = {
    id: string
    name: string
    date: number
    currentUsersCount: number
    type: RoomType
    stage: StageCode | InGameCode
    props: Omit<ServerRoomProps, "draftStages"> & { withBan: boolean }
}
