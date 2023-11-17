import { FC } from "react";
import { MobData } from "../Classes/Class";

interface IProps {
    mobData: MobData
}

export const MobDataCardComponent: FC<IProps> = ({ mobData }) => {
    const { value, guild: { name } } = mobData
    
    return <div className="w-24 p-4 flex flex-col h-36 rounded-lg bg-red-100">
       <div className="flex justify-between"> 
            <h3>
                { value }
            </h3>
            <h2>
                { name }
            </h2>
       </div>
        {/* <p>
            { action }
        </p> */}
    </div>
}