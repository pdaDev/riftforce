import { FC } from "react"
import { FieldsController, MapNode, Turn } from "../Classes/Class"
import { GameFieldNodeComponent } from "./GameFieldNodeComponent"
import { observer } from "mobx-react-lite"

interface IProps {
    gameField: FieldsController
    turn: Turn
}

export const GameFieldComponent: FC<IProps> = observer(
    ({ gameField, turn }) => {
        const nodes: MapNode[] = []
        const foundTeamForCurrentUser = turn.usersOrder.find(
            ([user]) => user.id === turn.currentUser?.id
        )
        const frontSideTeam = foundTeamForCurrentUser
            ? foundTeamForCurrentUser[1]
            : turn.usersOrder[0][1]

        gameField.iterateThroughTeamNodes(
            (node) => nodes.push(node),
            frontSideTeam
        )

        const backSideNodes = nodes.map((node) => node.up!)

        return (
            <div className="flex flex-col gap">
                <div className="flex justify-center items-end">
                    {backSideNodes.map((node) => (
                        <GameFieldNodeComponent
                            key={node.code}
                            reverse
                            isMyTurn={turn.isMyTurn}
                            node={node}
                        />
                    ))}
                </div>
                <div className="w-full h-4 bg-amber-500 rounded-lg" />
                <div className="flex justify-center">
                    {nodes.map((node) => (
                        <GameFieldNodeComponent
                            key={node.code}
                            isMyTurn={turn.isMyTurn}
                            node={node}
                        />
                    ))}
                </div>
            </div>
        )
    }
)
