import { FC, useEffect } from "react"
import {
    RoomsList,
    // SearchRoomsPanelComponent,
    useRooms,
} from "../../../features/rooms"
import { observer } from "mobx-react-lite"
import { Label } from "../../../shared"

export const RoomsSearch: FC = observer(() => {
    const { getList, resetList, listLoading, listFetching, list } = useRooms()

    useEffect(() => {
        getList()
        return resetList
    }, [])

    return (
        <div className="w-3/4">
            <Label variant="h1" className="mb-8">
                Комнаты
            </Label>
            {/* <SearchRoomsPanelComponent /> */}
            <RoomsList
                data={list}
                loading={listLoading}
                fetching={listFetching}
            />
        </div>
    )
})
