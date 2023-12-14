import { FC } from "react";
import { CommonCardProps, RoomType } from "../../../shared";
import { ServerRoomCard } from "..";


interface IProps extends CommonCardProps<ServerRoomCard> {
}

export const RoomCard: FC<IProps> = ({ data, onClick, loading }) => {
    if (data && !loading) {
        const { name, currentUsersCount, props: { playersCount }, type } = data

        return (
            <div className="rounded-md px-4 shadow-md py-2 w-full" tabIndex={0} onClick={onClick}>
                { name }
                { `${currentUsersCount} / ${playersCount}` }
                { type === RoomType.public ? 'pub' : 'pr' }
            </div>
        )
    }

    return (
        <div className="">

        </div>
    )
}