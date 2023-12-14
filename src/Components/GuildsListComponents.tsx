import { FC } from "react";
import { Guild } from "../Classes/Class";
import { GuildComponent } from "./GuildComponent";
import { observer } from "mobx-react-lite";

interface IProps {
    guilds: Guild[] | Set<Guild>
    banned?: boolean
}

export const GuildsListComponent: FC<IProps> = observer(({ banned, guilds }) => {
    return <div className="flex gap-5 ">
        { banned && 'Забанены' }
        { Array.from(guilds).map(g => <GuildComponent guild={g}
                                          key={g.code}
                                          banned={banned}
        />) }
    </div>
})