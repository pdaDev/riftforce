import { FC } from "react";
import { GuildCard } from "../Classes/Class";
import { observer } from "mobx-react-lite";
import { SelectiveElementComponent } from "./SelectiveElementComponent";

interface IProps {
    card: GuildCard
}

export const GuildCardComponent: FC<IProps> = observer(({ card }) => {

    return (
        <SelectiveElementComponent element={card}>
            <div className={' rounded-md w-24 flex items-center justify-center h-24'}
            >
                { card.guild.name }
            </div>
        </SelectiveElementComponent>
    )

    return
})