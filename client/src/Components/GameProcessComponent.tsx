import { FC } from "react"
import { GameProcess } from "../Classes/Class"
import { GameFieldComponent } from "./GameFieldComponent"
import { DecksComponent } from "./DecksComponent"
import { SequentialStrategyComponent } from "./SequantialStrategyComponent"
import { TurnWithPointsComponent } from "./TurnWithPointsComponent"
import { UserTuple } from "../Classes/namespace"
import { observer } from "mobx-react-lite"

interface IProps {
    process: GameProcess
}

export const GameProcessComponent: FC<IProps> = observer(({ process }) => {
    const {
        points,
        action: { strategy },
        usersCards,
        gameField,
        turn,
    } = process

    if (usersCards.size === 0) {
        return null
    }

    const { groupedTeamsInRightOrder: groups, currentUser, isGuest } = turn

    const renderGroupOfCards = (group: UserTuple[], reversed = false) => {
        return (
            <div className="flex justify-center">
                {group.map(([user]) => (
                    <DecksComponent
                        enableDraw={!strategy}
                        reversed={reversed}
                        showCards={
                            !currentUser ||
                            isGuest ||
                            currentUser.id === user.id
                        }
                        key={user.id}
                        controller={usersCards.get(user)!}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="relative h-full flex flex-col justify-center overflow-hidden w-full">
            <TurnWithPointsComponent turn={turn} points={points} />
            <div className="absolute -top-[220px] left-0 w-full">
                {renderGroupOfCards(groups[1], true)}
            </div>
            <GameFieldComponent gameField={gameField} turn={turn} />
            <div className="absolute top-[85%] w-full">
                {renderGroupOfCards(groups[0])}
            </div>
            <SequentialStrategyComponent strategy={strategy} turn={turn} />
        </div>
    )
})
