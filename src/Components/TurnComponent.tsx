import { FC, useEffect } from "react";
import { Turn } from "../Classes/Class";
import { observer } from "mobx-react-lite";

interface IProps {
    turn: Turn
}

export const TurnComponent: FC<IProps> = observer(({ turn }) => {
    const { currentTurn } = turn

    useEffect(() => {

    }, [currentTurn])

    return (
        <>
            <h3 className="font-medium text-md">
                Текущий ход&nbsp;
                { currentTurn.name }
            </h3>
        </>
    )
})