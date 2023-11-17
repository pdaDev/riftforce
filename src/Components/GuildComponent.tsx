import { FC } from "react"
import { Guild } from "../Classes/Class"
import { GuildLogo } from "./GuildLogo"
import { Tooltip } from "@mui/material"

interface IProps {
    guild: Guild
    banned?: boolean
}

export const GuildComponent: FC<IProps> = ({ guild, banned }) => {
    const { action, name, icon } = guild

    return <div className={`${banned && ''}`}>
        {/* <GuildLogo logo={icon} label={name} /> */}
        { name }
    </div>
}