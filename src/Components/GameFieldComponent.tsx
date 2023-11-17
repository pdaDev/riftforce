import { FC, useMemo } from "react";
import { FieldsController, MapNode } from "../Classes/Class";
import { GameFieldNodeComponent } from "./GameFieldNodeComponent";

interface IProps {
    gameField: FieldsController
}

export const GameFieldComponent: FC<IProps> = ({ gameField }) => {

    const field = useMemo(() => {
        const nodes: MapNode[] = []
        gameField.iterateThroughMyNodes(node => nodes.push(node))
        
        return nodes.map(node => <GameFieldNodeComponent key={node.code}
                                                         node={node}
                                 />)

    }, [gameField])

    return <div className="flex">
     { field }
    </div>
}
