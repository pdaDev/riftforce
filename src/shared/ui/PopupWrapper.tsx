import { ComponentType } from 'react'
import * as NS from '../../widgets/popups/namespace'
import { renderPopup } from '../../widgets/popups/lib'

export const PopupWrapper = (modalKey: NS.ModalsKeys, Component: ComponentType<NS.ModalProps>) => {
    return renderPopup(modalKey, Component)
}