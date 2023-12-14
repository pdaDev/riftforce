import { IPassPasswordPopupProps } from "../../features/rooms"
import { IBasePopupProps } from "../../shared"

export interface IConfirmPayload {
    index: string
    onConfirm: Function
}

export interface IDeclineChangesPayload {
    onConfirm: Function
}

export type Modals = {
    "confirm": IConfirmPayload
    "decline-changes": IDeclineChangesPayload
    "create-room": null
    "password-pass": IPassPasswordPopupProps
    "local-play": null
}

export type ModalsKeys = keyof Modals
export type CommonModal = {
    key: string
    payload?: any
}
export type Modal = { [T in ModalsKeys]: Modals[T] extends never ? { key: T } : { key: T, payload: Modals[T] } }[ModalsKeys]

export type ModalProps = IBasePopupProps & any