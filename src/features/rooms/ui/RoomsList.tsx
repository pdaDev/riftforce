import { FC } from "react";
import { RoomCard, ServerRoomCard } from "../../../entities/room";
import { List, RoomType } from "../../../shared";
import { useAppNavigate } from "../../../app/services/routes";
import { usePopupsStore } from "../../../widgets/popups";


type IProps = {
    data: ServerRoomCard[]
    fetching?: boolean
    loading?: boolean
}

export const RoomsList: FC<IProps> = ({ data, fetching, loading }) => {

    const n = useAppNavigate()
    const { openModal } = usePopupsStore()

    const onRoomCardClick = ({ id, type, name }: ServerRoomCard) => () => {
       if (type === RoomType.private) {
            openModal({
                key: 'password-pass',
                payload: {
                    title: name,
                    id
                }
            })
       } else {
        n(p => p.rooms._key_(id))
       }
    }

    return (
        <List data={data}
              fetching={fetching}
              loading={loading}
              renderListEl={(el, loading) => (
                <RoomCard data={el}
                          loading={loading}
                          onClick={onRoomCardClick(el!)}
                />
              )}
        />
    )
}