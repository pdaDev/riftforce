import { FC } from "react"
import { CommonCardProps, Label, RoomType } from "../../../shared"
import { ServerRoomCard } from ".."
import { StageCode } from "../../../Classes/namespace"

interface IProps extends CommonCardProps<ServerRoomCard> {}

export const RoomCard: FC<IProps> = ({ data, onClick, loading }) => {
    if (data && !loading) {
        const {
            name,
            currentUsersCount,
            props: { playersCount, withExtension, withBan },
            type,
            stage,
        } = data

        const isPrivate = type === RoomType.private
        const isStarted = stage !== StageCode.room

        return (
            <div
                className="rounded-md flex w-full justify-between  px-4 shadow-md py-3 w-full"
                tabIndex={0}
                onClick={onClick}>
                <div className="flex gap-2 flex-col">
                    <Label value={name} variant="h2" />
                    {isPrivate && (
                        <Label
                            variant="h2"
                            className="text-slate-200"
                            value={"Приватная"}
                        />
                    )}
                    <div className="flex items-center gap-2">
                        <h4>Бан</h4>
                        {withBan ? (
                            <div className="rounded-md px-2 py-0.5 bg-green-200 ">
                                активен
                            </div>
                        ) : (
                            <div className="rounded-md px-2 py-0.5 bg-red-200">
                                не активен
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <h4>Расширение</h4>
                        {withExtension ? (
                            <div className="rounded-md px-2 py-0.5 bg-green-200 ">
                                активно
                            </div>
                        ) : (
                            <div className="rounded-md px-2 py-0.5 bg-red-200">
                                не активно
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2 items-center">
                    <h4 className="text-lg text-slate-400 font-medium">
                        {`${currentUsersCount} / ${playersCount}`}
                    </h4>

                    {isStarted && (
                        <div className="px-3 py-1 rounded-md bg-green-200">
                            Идет игра
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return <div className=""></div>
}
