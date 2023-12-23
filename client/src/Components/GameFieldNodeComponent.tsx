import { FC } from "react"
import { MapNode } from "../Classes/Class"
import { FieldComponent } from "./FieldComponent"
import { observer } from "mobx-react-lite"

interface IProps {
    node: MapNode
    isMyTurn: boolean
    reverse?: boolean
}

export const GameFieldNodeComponent: FC<IProps> = observer(
    ({ node, isMyTurn, reverse = false }) => {
        if (node) {
            const fields = reverse ? [...node.fields].reverse() : node.fields

            return (
                <div className="flex flex-col rounded-md justify-start items-center gap-1">
                    {fields.map((field) => (
                        <FieldComponent
                            key={field.code}
                            showEmpty={isMyTurn}
                            field={field}
                        />
                    ))}
                </div>
            )
        }

        return null
    }
)
