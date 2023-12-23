import { FC } from "react"
import { MobData } from "../Classes/Class"

interface IProps {
    mobData: MobData
}

export const MobDataCardComponent: FC<IProps> = ({ mobData }) => {
    const {
        value,
        guild: { name, color },
    } = mobData

    return (
        <div
            className={`p-4 border-${color} w-full h-full border-8 flex flex-col h-36 rounded-lg`}>
            <div className="flex gap-2 justify-between">
                <h3>{value}</h3>
                <h2>{name}</h2>
                <h3>{value}</h3>
            </div>
            {/* <p>
            { action }
        </p> */}
        </div>
    )
}
