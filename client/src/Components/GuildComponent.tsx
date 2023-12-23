import { FC } from "react"
import { Guild } from "../Classes/Class"

interface IProps {
    guild: Guild
    banned?: boolean
}

export const GuildComponent: FC<IProps> = ({ guild, banned }) => {
    const { name } = guild

    return <div className={`${banned && ''}`}>
        {/* <GuildLogo logo={icon} label={name} /> */}
        { name }
    </div>
}