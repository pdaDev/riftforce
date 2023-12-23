import { FC } from "react"
import { Elemental } from "../Classes/Class"

interface IProps {
    elemental: Elemental
}

export const ElementalComponent: FC<IProps> = ({ elemental }) => {
    const { guild, health, maxHealth } = elemental
    const { name, color } = guild

    return (
        <div
            className={`rounded-xl relative flex justify-center w-24 h-24 shadow-md bg-${color} p-4 flex`}>
            <h3 className="absolute -top-2 text-white  px-3 py-1 text-sm rounded-3xl bg-amber-500">
                {health}
            </h3>
            <div className="flex flex-col justify-center relative">
                <h3>{name}</h3>
                <h3 className="text-center">{maxHealth}</h3>
            </div>
        </div>
    )
}
