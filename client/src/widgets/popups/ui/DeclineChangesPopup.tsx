import { FC } from "react"
import { IBasePopupProps, PopupWithControls } from "../../../shared"
import { IDeclineChangesPayload } from "../namespace"
import { withPopup } from ".."

const DeclineChangesPopupComponent: FC<IDeclineChangesPayload & IBasePopupProps> = ({ onClose, onConfirm }) => {
    const handleSubmit = () => {
        onConfirm()
        onClose()
    }
    return (
        <PopupWithControls
            className="max-w-md"
            title="Были внесены изменения"
            onDecline={onClose}
            onSubmit={handleSubmit}
        >
            Были внесены изменения. При подтверждения все внесенные изменения будут потеряны 
        </PopupWithControls>
    )
    return null
}

export const DeclineChangesPopup = withPopup('decline-changes')(DeclineChangesPopupComponent)