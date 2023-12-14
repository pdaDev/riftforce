import { FC, useMemo } from "react";
import { FieldsController, MapNode, Turn } from "../Classes/Class";
import { GameFieldNodeComponent } from "./GameFieldNodeComponent";

interface IProps {
    gameField: FieldsController
    turn: Turn
}

export const GameFieldComponent: FC<IProps> = ({ gameField, turn }) => {

    const field = useMemo(() => {
        const nodes: MapNode[] = []
        const foundTeamForCurrentUser = turn.usersOrder.find(([user]) => user.id === turn.currentUser?.id)
        const frontSideTeam = foundTeamForCurrentUser ? foundTeamForCurrentUser[1] : turn.usersOrder[0][1]
        
        gameField.iterateThroughTeamNodes(node => nodes.push(node), frontSideTeam)
        
        return nodes.map(node => <GameFieldNodeComponent key={node.code}
                                                         node={node}
                                 />)

    }, [gameField, turn])

    return <div className="flex">
     { field }
    </div>
}
