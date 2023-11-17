import { FC } from "react";
import { Elemental } from "../Classes/Class";

interface IProps {
    elemental: Elemental
}

export const ElementalComponent: FC<IProps> = ({ elemental }) => {
    const { guild, health, maxHealth } = elemental
    const { name, color } = guild

    return (
        <div className={`rounded-lg bg-${color} p-4 flex`}>
            <div className="flex justify-center relative">
                <h3>
                    { name }
                </h3>
                <h3 className="absolute -top-5 -right-10 text-sm rounded-full bg-indigo-400">
                    { health }&nbsp;/&nbsp; { maxHealth } 
                </h3>
            </div>
        </div>
    )
}

