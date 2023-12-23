import { FC } from "react";
import { GameRoomPropsController } from "../../../Classes/Class";
import { t } from "../lib";
import { GameProp } from "./GameProp";
import { ServerRoomPropsPayload } from "..";
import { GameRoomPropsEditForm } from "./GamePropsEditForm";
import { ServerPropsWithoutName } from "../../../Classes/namespace";

interface IProps {
    props: GameRoomPropsController
    editProps: (data: Partial<ServerRoomPropsPayload>) => Promise<void>
    loading?: boolean
    setViewMode: () => void,
    isEdit: boolean
}

export const GamePropsComponent: FC<IProps> = ({ props, isEdit, setViewMode, loading, editProps }) => {
    const { withExtension, playersCount,draftStages } = props

    
    const formSubmitHandler = (data: ServerPropsWithoutName) => {
        editProps(data).then(setViewMode)
    }

    if (isEdit) {
        return <GameRoomPropsEditForm onClose={setViewMode} 
            props={props}
            loading={loading}
            onSubmit={formSubmitHandler}
            canSubmit={true}
            submitButtonLabel={'Редактировать'}
        />
    }

    return <div>
   
        <GameProp title="Количество игроков" value={playersCount} />
        <GameProp title="Дополнение" value={withExtension ? 'Активно' : 'Неактивно'} />
        <GameProp title="Стадии драфта">
            <div>
                { draftStages.map((stage, i) => <div key={i}>{t(stage)}</div>) }
            </div>
        </GameProp>
    </div>
}
