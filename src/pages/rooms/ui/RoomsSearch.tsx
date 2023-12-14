import { FC, useEffect } from "react";
import { RoomsList, SearchRoomsPanelComponent, useRooms } from "../../../features/rooms";
import { observer } from "mobx-react-lite";
import Fab from '@mui/material/Fab';
import {  usePopupsStore } from "../../../widgets/popups";


export const RoomsSearch: FC = observer(() => {   
    const { getList, resetList, listLoading, listFetching, list } = useRooms()
    
    useEffect(() => {
        getList()
        return resetList
    }, [])

    const { openModal } = usePopupsStore()
    const createRoomOpenPopup = () => {
        openModal({ key: 'create-room', payload: null })
    }

    return (
            <div>
                <SearchRoomsPanelComponent/>
                    <RoomsList data={list}
                               loading={listLoading}
                               fetching={listFetching}
                    />
                    <Fab variant="extended" size="medium" onClick={createRoomOpenPopup} color="primary">
                        Cоздать комнату
                    </Fab>
            </div>
        )
    }
)