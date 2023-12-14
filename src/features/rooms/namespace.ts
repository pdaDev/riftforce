import { ServerRoomCard } from "../../entities/room";
import { ApiResponse, CommonListPayload, DraftStage, EntitiesAPI, RoomType } from "../../shared";

export type ServerRoomPropsPayload = {
    playersCount: number
    withExtension: boolean
    name: string
    password: string | null
    draftStages: DraftStage[]
    type: RoomType
}

export type ServerRoomPropsResponse = Omit<ServerRoomPropsPayload, 'password'>

export type GetRoomsPayload = CommonListPayload & {
    filters: Partial<ServerRoomPropsPayload>
} 

export type ConnectToRoomPayload = {
    password?: string
    team?: string
    id: string
}

export interface RoomsApi extends EntitiesAPI<ServerRoomCard> {
    createRoom(payload:ServerRoomPropsPayload): ApiResponse<string>
    connect(payload: ConnectToRoomPayload): Promise<boolean>
}

export enum RequestKeys {
    create = 'CREATE',
    getList = 'LIST',
    connect = 'CONNECT'
}

export interface IPassPasswordPopupProps {
    id: string
    title?: string 
    onPasswordSuccess?: () => void
}
