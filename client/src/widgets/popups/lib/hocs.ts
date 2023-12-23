import { observer } from "mobx-react-lite"
import { ComponentType, FC } from "react"
import { ModalsKeys, ModalProps } from "../namespace"
import { renderPopup } from "."




export const withPopup = (modalKey: ModalsKeys) => (Component: ComponentType<ModalProps>) => {
    const Container: FC = observer( () => {
        return renderPopup(modalKey, Component)
     })

    return Container
}
