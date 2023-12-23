import { FC } from "react"
import { Field } from "../Classes/Class"
import { ElementalComponent } from "./ElementalComponent"
import { SelectiveElementComponent } from "./SelectiveElementComponent"
import { observer } from "mobx-react-lite"

interface IProps {
    field: Field
    showEmpty: boolean
}

export const FieldComponent: FC<IProps> = observer(({ field, showEmpty }) => {
    const { elemental } = field

    return (
        <SelectiveElementComponent element={field}>
            <div
                className={`w-24 h-24 ${
                    !elemental && (showEmpty ? "bg-gray-200" : "opacity-0")
                } rounded-xl
                `}>
                {elemental && <ElementalComponent elemental={elemental} />}
            </div>
        </SelectiveElementComponent>
    )
})
