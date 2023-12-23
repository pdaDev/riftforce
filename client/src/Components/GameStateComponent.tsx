import { FC, ReactNode } from "react"

import {
    GameEnd,
    GameRoom,
    GameState,
    InGameStageController,
} from "../Classes/Class"
import { observer } from "mobx-react-lite"
import { GameType, StageCode } from "../Classes/namespace"
import { GameRoomComponent } from "./GameRoomComponent"
import { InGameStageControllerComponent } from "./InGameStageControllerComponent"
import { GameEndComponent } from "./EndGameComponent"
import { Chat } from "./Chat"

interface IProps {
    state: GameState
}

export const GameStateComponent: FC<IProps> = observer(({ state }) => {
    const { currentStage, sendMessage, messages, type } = state

    const stagesComponents: Partial<Record<StageCode, ReactNode>> = {
        [StageCode.game]: (
            <InGameStageControllerComponent
                controller={currentStage as InGameStageController}
            />
        ),
        [StageCode.end]: <GameEndComponent gameEnd={currentStage as GameEnd} />,
        [StageCode.room]: (
            <GameRoomComponent gameRoom={currentStage as GameRoom} />
        ),
    }

    const showChat =
        currentStage?.code === StageCode.game && type !== GameType.local

    return (
        <div className="relative w-full">
            {showChat && (
                <div className="absolute left-0 top-[60%] -translate-y-[50%] z-10 rounded-md p-4 shadow-md">
                    <Chat sendMessage={sendMessage} messages={messages} />
                </div>
            )}
            {currentStage && stagesComponents[currentStage.code as StageCode]}
        </div>
    )
})
