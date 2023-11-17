import { FC } from "react";
import { MapNode } from "../Classes/Class";
import { FieldComponent } from "./FieldComponent";

interface IProps {
    node: MapNode
}

export const GameFieldNodeComponent: FC<IProps> = ({  node }) => {

    const renderFields = (node: MapNode | null, reversed?: boolean) => {
        if (node) {
            const fields = reversed ? [...node.fields].reverse() : node.fields
            
            return <div className="flex flex-col justify-start items-center gap-3">
                {
                    fields.map(field => <FieldComponent key={field.code}
                        field={field} />)
                }
            </div>
        }

        return null
    }

    return <div className="flex w-full flex-col gap-2">
        { renderFields(node.up, true) }
        <div className="h-10 bg-indigo-600">
        </div>
        { renderFields(node) }
    </div>
}

