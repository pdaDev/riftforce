import { Backdrop } from "@mui/material"
import { ComponentType, MouseEventHandler } from "react"
import { usePopupsStore, usePopup } from "./hooks"
import * as NS from '../namespace'

export const renderPopup = (modalKey: NS.ModalsKeys, Component: ComponentType<NS.ModalProps>) => {
    const { opened, openedKeys, closeModal } = usePopupsStore()
    
    const index = openedKeys.indexOf(modalKey)
    const closeCurrentModal: MouseEventHandler<HTMLDivElement> = () => {
        closeModal(modalKey)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeModal(modalKey)
        }
    }


    const isModalOpen = index !== -1       
    usePopup(isModalOpen)

    const onModalClick: MouseEventHandler<HTMLDivElement> = e => {
        e.stopPropagation()
    }

    if (isModalOpen) {
        return <Backdrop
                    onKeyDown={onKeyDown}
                    open={isModalOpen}
                    onClick={closeCurrentModal}
      >
        <div className="bg-white rounded-lg p-4 " id='modal' onClick={onModalClick}>
            <Component onClose={closeCurrentModal}
                        currentKey={modalKey}
                        { ...opened[index]?.payload }
            />
        </div>
        
      </Backdrop>
    }


    return <></>
}