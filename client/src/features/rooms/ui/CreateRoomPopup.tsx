import { ChangeEventHandler, FC, useRef } from "react";
import {  TextField } from "@mui/material";
import { IBasePopupProps, ValidationField } from "../../../shared";
import { useAppNavigate } from "../../../app/services/routes";
import { roomNameScheme } from "../lib";
import { GameRoomPropsController } from "../../../Classes/Class";
import { GameRoomPropsEditForm } from "./GamePropsEditForm";
import { ServerPropsWithoutName } from "../../../Classes/namespace";
import { useRooms } from "../lib/hooks";
import { observer } from "mobx-react-lite";

export const CreateRoomPopup: FC<IBasePopupProps> = observer(({ onClose }) => {
    const { create, creationLoading } = useRooms()
    const contentRef = useRef(new GameRoomPropsController(undefined, true))
    const nameRef = useRef(new ValidationField('', roomNameScheme))
    const props = contentRef.current
    const name = nameRef.current

    
    const n = useAppNavigate()

    const handleCreateRoom = async (data: ServerPropsWithoutName) => {
        const id = await create({ ...data , name: name.data as string })

        if (id) {
            onClose()
            n(p => p.rooms._key_(id))
        }
    }

    const onNameChange: ChangeEventHandler<HTMLInputElement> = e => {
        name.setValue(e.target.value)
    }

    console.log(name.isValid)

    return <div className="w-[600px] w-full">
        <h2 className="text-xl font-semibold mb-2">
            Создать комнату
        </h2>
        <TextField value={name.data}
               error={!!name.error}
               size="small"
               helperText={name.error}
               placeholder="Введите название комнаты"
               onChange={onNameChange}
        />
        <GameRoomPropsEditForm onClose={onClose} 
                               props={props}
                               loading={creationLoading}
                               onSubmit={handleCreateRoom}
                               canSubmit={name.isValid && !!name.data}
                               submitButtonLabel={'Создать'}
        />
    </div>
})

