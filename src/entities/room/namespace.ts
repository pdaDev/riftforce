import { ServerRoomProps } from "../../Classes/namespace"
import { RoomType } from "../../features/rooms"

export type ServerRoomCard = {
    id: string
    name: string
    date: number
    currentUsersCount: number
    type: RoomType
    props: Omit<ServerRoomProps, 'draftStages'> & { withBan: boolean }
}

