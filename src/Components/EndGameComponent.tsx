import { FC } from "react";
import { GameEnd } from "../Classes/Class";

interface IProps {
    gameEnd: GameEnd
}

export const GameEndComponent: FC<IProps> = ({ gameEnd }) => {
    const { restart, goToRoomMenu } = gameEnd

    return (
    <>
    <button onClick={restart}>
        Заново
    </button>
    <button onClick={restart}>
        Выйти в меню комнаты
    </button>
    <button onClick={restart}>
        Выйти в меню комнаты
    </button>
    </>
    )
}