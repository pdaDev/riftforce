import { AxiosInstance } from "axios"
import { CommonResultServerResponse, GetEntitiesListPayload, HTTPAxiosAPI, ResponseResult, ServerListResponse, StatusAction } from "../../../shared"
import { RoomsApi, RequestKeys, ServerRoomPropsPayload, ConnectToRoomPayload } from ".."
import { ServerRoomCard } from "../../../entities/room"


export class RoomsAPI extends HTTPAxiosAPI implements RoomsApi {
    constructor(axios?: AxiosInstance, baseUrl?: string) {
        super(baseUrl || 'rooms', axios)
    }

    createRoom = async (payload: ServerRoomPropsPayload) => {
        return await this.post<string>('', payload, {
            errorMessage: 'create room error',
            key: RequestKeys.create
        })
    }

    connect = async ({ id, ...payload }: ConnectToRoomPayload) => {
        const res = await this.post<CommonResultServerResponse>(`/${id}`, payload, {
            key: RequestKeys.connect
        })

        if (res && res.result === ResponseResult.success) {
            return true
        }

        return false
    }

    getList = async ({ key, ...payload }:  GetEntitiesListPayload) => {
       return await this.get<ServerListResponse<ServerRoomCard>>(this.transformListRequestPayloadToQuery('', payload), {
                    errorMessage: 'get rooms error error',
                    key,
                    statuses: {
                        400: {
                            action: StatusAction.total_error_disabled,
                            message: "Что-то пошло не так"
                        },
                        500: {
                            action: StatusAction.total_error_disabled,
                            message: "Что-то пошло не так"
                        }
                    }
        })
    }

    // getList = async ({ key, ...payload }) => {
    //  await this.get<ServerListResponse<ServerRoomCard>>('', payload, {
    //         errorMessage: 'get rooms error error',
    //         key,
    //     })
    // }
}
