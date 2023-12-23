import { FC } from "react";
import { GuildsPoolController } from "../Classes/Class";
import { GuildCardComponent } from "./GuildCardComponent";
import { observer } from "mobx-react-lite";

interface IProps {
    pool: GuildsPoolController;
}

export const GuildsPoolComponent: FC<IProps> = observer(({ pool }) => {
    const { guilds } = pool;

    return (
        <div className="w-full flex justify-center">
            <div className="grid container gap-4 w-fit grid-cols-5">
                {guilds.map((guild) => (
                    <GuildCardComponent key={guild.guild.code} card={guild} />
                ))}
            </div>
        </div>
    );
});
