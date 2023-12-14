import { FC, ReactNode } from "react";

import { GameRoom, GameState, InGameStageController } from "../Classes/Class";
import { observer } from "mobx-react-lite"
import { StageCode} from "../Classes/namespace";
import { GameRoomComponent } from "./GameRoomComponent";
import { InGameStageControllerComponent } from "./InGameStageControllerComponent";


interface IProps {
    state: GameState
}

export const GameStateComponent: FC<IProps> = observer(({ state }) => {
    const { currentStage } = state

    const stagesComponents: Partial<Record<StageCode, ReactNode>> = {
        [StageCode.game]: <InGameStageControllerComponent controller={currentStage as InGameStageController} />,
        // [StageCode.end]: <GameEndComponent gameEnd={currentStage as GameEnd} />,
        [StageCode.room]: <GameRoomComponent gameRoom={currentStage as GameRoom}/>
    }

    return <div>
       { currentStage && stagesComponents[currentStage.code as StageCode] }
    </div>
})