import { FC } from "react";
import { GameProcess } from "../Classes/Class";
import { GameFieldComponent } from "./GameFieldComponent";
import { HandDeckComponent } from "./HandDeckComponent";
import { SequentialStrategyComponent } from "./SequantialStrategyComponent";
import { TurnWithPointsComponent } from "./TurnWithPointsComponent";
import { UserTuple } from "../Classes/namespace";

interface IProps {
    process: GameProcess
}

export const GameProcessComponent: FC<IProps> = ({ process }) => {
    const { points, action: { strategy }, usersCards, gameField, turn } = process

    const groups =  turn.groupedTeamsInRightOrder

    const renderGroupOfCards = (group: UserTuple[]) => {
        return group.map(([user]) => <HandDeckComponent key={user.id} deck={usersCards.get(user)!.hand} />)   
    }
    
    return (
        <>
            <TurnWithPointsComponent turn={turn} points={points} />
            { renderGroupOfCards(groups[1]) }
            <GameFieldComponent gameField={gameField} turn={turn} />
            { renderGroupOfCards(groups[0]) }
            <SequentialStrategyComponent strategy={strategy} />
        </>
    )
}