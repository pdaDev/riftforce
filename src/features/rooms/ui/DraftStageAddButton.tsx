import { FC } from "react"
import { DraftStage } from "../../../shared"

interface IProps {
    stage: DraftStage
    addStage: (state: DraftStage) => void
    translateStage: (state: DraftStage) => string
}

export const DraftStageAddButton: FC<IProps> = ({
    addStage, translateStage, stage
}) => {
    const onButtonClick = () => addStage(stage)
    return (
        <button onClick={onButtonClick} className="px-2 py-1 rounded-md bg-fuchsia-500 text-white relative" >
          { translateStage(stage)}
        </button>
    )
}