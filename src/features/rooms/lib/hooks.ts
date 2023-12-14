import { useRef } from "react"
import { useStore } from "../../../app/store"
import { RequestKeys, RoomsAPI } from ".."

export const useRooms = () => {
    const data = useStore().roomsSearch
    const ref = useRef(new RoomsAPI())

    return {
        ...data,
        connectionLoading: ref.current.loadingStatuses[RequestKeys.connect],
        listLoading: data.listLoading,
        listFetching: data.listFetching,
        creationLoading: ref.current.loadingStatuses[RequestKeys.create],
        create: ref.current.createRoom,
        connect: ref.current.connect
    }
}