import { FC, useState } from "react";
import { IPassPasswordPopupProps, useRooms } from "..";
import { PasswordInput } from "../../../shared/ui/PasswordInput";
import { useAppNavigate } from "../../../app/services/routes";
import { IBasePopupProps, NotificationType, NotificationVariant, PopupWithControls } from "../../../shared";
import { useNotifications } from "../../../widgets/notifications";


export const PassRoomPasswordPopup: FC<IPassPasswordPopupProps & IBasePopupProps> = ({ onClose, onPasswordSuccess, id, title }) => {
    const { connectionLoading, connect } = useRooms()
    const { addNotification } = useNotifications()
    const [password, setPassword] = useState('')
    const n = useAppNavigate()

    const onSubmit = async () => {
        const hasAccess = await connect({ id, password })
        if (hasAccess) {
            onPasswordSuccess ? onPasswordSuccess() :  n(p => p.rooms._key_(id))
            onClose()
        } else {
            setPassword('')
            addNotification({ variant: NotificationVariant.error, message: 'Неверный логин', type: NotificationType.system })
        }
    }

    const popupTitle =  title ? `Присоединиться к ${title}` : 'Введите пароль'

    return (
        <PopupWithControls onDecline={onClose}
                           onSubmit={onSubmit}
                           title={popupTitle}
                           disabled={!password}
                           loading={connectionLoading}
                           submitTitle="Присоединиться"
        >
            <PasswordInput value={password}
                        onChange={setPassword}
            />
        </PopupWithControls>
    )
    
}
