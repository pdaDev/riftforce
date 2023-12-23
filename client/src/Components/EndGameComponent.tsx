import { FC } from "react"
import { GameEnd } from "../Classes/Class"
import { Label } from "../shared"
import { useAppNavigate } from "../app/services/routes"
import { Avatar } from "@mui/material"

interface IProps {
    gameEnd: GameEnd
}

export const GameEndComponent: FC<IProps> = ({ gameEnd }) => {
    const { goToRoomMenu, winner } = gameEnd
    const n = useAppNavigate()
    const goToSearch = () => n((p) => p.home)
    const has2Users = winner.users.length === 2

    return (
        <div className="rounded-lg p-4 shadow-md flex justify-center flex-col">
            <Label variant="h1">Победител{has2Users ? "и" : "ь"}</Label>
            <div className="flex gap-2">
                {winner.users.map(({ name, avatar }) => {
                    return (
                        <div className="flex flex-col items-center gap-2">
                            <Avatar src={avatar || ""} />
                            <Label variant="h4" value={name} />
                        </div>
                    )
                })}
            </div>

            <button onClick={goToRoomMenu}>В комнату</button>
            <button onClick={goToSearch}>Выйти</button>
        </div>
    )
}
