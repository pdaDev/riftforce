import { FC, ReactNode } from "react";
import { useStore } from "../app/Context";
import { DraftComponent } from "./DraftComponent";
import { Draft, GameEnd, GameProcess, GameRoom, GameStageCode } from "../Classes/Class";
import { GameProcessComponent } from "./GameProcessComponent";
import { observer } from "mobx-react-lite";
import { RoomComponent } from "./RoomComponent";
import { GameEndComponent } from "./EndGameComponent";


export const GameStateComponent: FC = observer(() => {
    const { gameState } = useStore()
    const { currentStage } = gameState

    const stagesComponents: Record<GameStageCode, ReactNode> = {
        'GAME': <GameProcessComponent process={currentStage as GameProcess} />,
        'DRAFT': <DraftComponent  draft={currentStage as Draft} />,
        'END': <GameEndComponent gameEnd={currentStage as GameEnd} />,
        'ROOM': <RoomComponent gameRoom={currentStage as GameRoom}/>
    }

    return <div>
       { currentStage && stagesComponents[currentStage.code] }
    </div>
})