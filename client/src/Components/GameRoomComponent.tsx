import { observer } from "mobx-react-lite";
import { FC, useEffect } from "react";
import { GameRoom } from "../Classes/Class";
import { TeamsComponent } from "./RoomTeamsComponent";
import { GamePropsComponent } from "../features/rooms/ui/GameRoomPropsComponent";
import { TitleAutoInput } from "../shared/ui/LabelAutoInput";
import { Button, Divider } from "@mui/material";
import { useFormMode } from "../shared";
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useAppNavigate } from "../app/services/routes";


interface IProps {
    gameRoom: GameRoom
}

export const GameRoomComponent: FC<IProps> = observer(({ gameRoom }) => {
    const { isOwner, props, editProps, blackList, undoBan, stop, canStart, subscribeOnUserKick, loading } = gameRoom

    const editName = async (name: string) => {
        await editProps({ name })
    }

    const { isEdit, setEditMode, setViewMode } = useFormMode()
    const n = useAppNavigate()

    useEffect(() => {
        subscribeOnUserKick(() => n(p => p.home))
    }, [])

    return (
    <div className="rounded-3xl shadow-md p-4 relative">
        <div className="pl-3">
            <TitleAutoInput canEdit={isOwner}
                            value={props.name}
                            variant="h1"
                            showLoadingAnyTime={false}
                            loading={loading}
                            onSubmit={editName}
            />
        </div>
        <Divider sx={{ mb: 2, mt: 1 }} />

             { isOwner && (
                <button type="button" className="absolute right-4 top-4" onClick={setEditMode}>
                    <EditIcon/>
                </button>
           
        ) }
        <TeamsComponent gameRoom={gameRoom} />
        { blackList.map(email => (
            <div className="bg-amber-300 w-fit text-sm rounded-md py-1 px-2 flex items-center gap-2">
                { email }
                <Button onClick={() => undoBan(email)}>
                    <CloseIcon />
                </Button>
            </div>
           
        )) }
        <GamePropsComponent isEdit={isEdit}
                            setViewMode={setViewMode}
                            props={props}
                            editProps={editProps}
        />
        { isOwner && (
             <Button onClick={stop}
                     disabled={!canStart}
                    >
                Начать
            </Button>
        ) }
    </div>
    )
})

