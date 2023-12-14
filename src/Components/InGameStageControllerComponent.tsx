import { FC, ReactNode } from "react";
import { Draft, GameProcess } from "../Classes/Class";
import { observer } from "mobx-react-lite";
import { DraftComponent } from "./DraftComponent";
import { GameProcessComponent } from "./GameProcessComponent";
import { IInGameStageController, InGameCode } from "../Classes/namespace";

interface IProps {
    controller: IInGameStageController
}

export const InGameStageControllerComponent: FC<IProps> = observer(({ controller }) => {
    const currentStage = controller.getStage()
    
    const stagesComponents: Record<InGameCode, ReactNode> = {
        [InGameCode.process]: <GameProcessComponent process={currentStage as GameProcess} />,
        [InGameCode.draft]: <DraftComponent  draft={currentStage as Draft} />
    }

    return <div>
       { currentStage && stagesComponents[currentStage.code as InGameCode] }
    </div>
})

