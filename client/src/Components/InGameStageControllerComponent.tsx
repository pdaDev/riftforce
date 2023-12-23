import { FC, ReactNode, useEffect } from "react"
import { Draft, GameProcess } from "../Classes/Class"
import { observer } from "mobx-react-lite"
import { DraftComponent } from "./DraftComponent"
import { GameProcessComponent } from "./GameProcessComponent"
import { IInGameStageController, InGameCode } from "../Classes/namespace"
import { useLayoutStore } from "../app/services/commonLayout"

interface IProps {
    controller: IInGameStageController
}

export const InGameStageControllerComponent: FC<IProps> = observer(
    ({ controller }) => {
        const currentStage = controller.getStage()
        const { hideFooterAndHeader, showFooterAndHeader } = useLayoutStore()

        useEffect(() => {
            hideFooterAndHeader()

            return showFooterAndHeader
        }, [])

        const stagesComponents: Record<InGameCode, ReactNode> = {
            [InGameCode.process]: (
                <GameProcessComponent process={currentStage as GameProcess} />
            ),
            [InGameCode.draft]: (
                <DraftComponent draft={currentStage as Draft} />
            ),
        }

        if (!currentStage) {
            return null
        }

        return stagesComponents[currentStage.code as InGameCode]
    }
)
