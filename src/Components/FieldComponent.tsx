import { FC } from "react";
import { Field } from "../Classes/Class";
import { ElementalComponent } from "./ElementalComponent";
import { SelectiveElementComponent } from "./SelectiveElementComponent";

interface IProps {
    field: Field
}

export const FieldComponent: FC<IProps> = ({ field }) => {
    const { elemental } = field

    return (
        <SelectiveElementComponent element={field}>
            <div className={`w-24 h-24 rounded-xl`}>
                { elemental && <ElementalComponent elemental={elemental}
                /> }
            </div>
        </SelectiveElementComponent>
    )
}

