import { FC, useEffect } from "react"
import { Label } from "../../../shared"
import { useRooms, RoomsList } from "../../../features/rooms"
import { useAuth } from "../../../features/auth"
import { observer } from "mobx-react-lite"

export const MyRooms: FC = observer(() => {
    const { user } = useAuth()
    const { getList, resetList, listLoading, listFetching, list } = useRooms()

    useEffect(() => {
        getList()
        return resetList
    }, [user])

    return (
        <div>
            <Label variant="h1" value="Мои комнаты" />
            <RoomsList
                data={list}
                loading={listLoading}
                fetching={listFetching}
            />
        </div>
    )
})
