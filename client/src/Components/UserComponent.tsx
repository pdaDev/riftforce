import { FC } from "react"
import { User } from "../Classes/Class"
import { Avatar } from "@mui/material"
import { UserType } from "../Classes/namespace"
import SmartToyIcon from "@mui/icons-material/SmartToy"

interface IProps {
    user: User
    hasTurn: boolean
}

export const UserComponent: FC<IProps> = ({ user, hasTurn }) => {
    const { avatar, name, type } = user
    const isBot = type === UserType.bot

    return (
        <div className="flex items-center gap-4">
            <div
                className={`rounded-full p-1 border-2 ${
                    hasTurn && "border-amber-300"
                } `}>
                {isBot ? (
                    <div className="rounded-full flex w-[40px] h-[40px] items-center justify-center p-1 text-white bg-[#bdbdbd]">
                        <SmartToyIcon />
                    </div>
                ) : (
                    <Avatar src={avatar || ""} />
                )}
            </div>
            <h3 className="font-semibold text-md ">{name}</h3>
            {isBot && <h4 className="font-light text-slate-300">{"(бот)"}</h4>}
        </div>
    )
}
