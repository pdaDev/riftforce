import { FC, MouseEventHandler, useState } from "react";
import { Card } from "../Classes/Class";
import { MobDataCardComponent } from "./MobDataCardComponent";
import { SelectiveElementComponent } from "./SelectiveElementComponent";

interface IProps {
    hidden?: boolean
    card?: Card
}

const TYPE_MODAL = {
    opened: 'OPENED',
    closed: 'CLOSED',
    summon: "SUMMON",
    activate: "ACTIVATE"
} as const

export const CardComponent: FC<IProps> = ({ card, hidden }) => {

    if (!card || hidden) {
        return <div>

        </div>
    }



    const { mobData, usable, summon, activate } = card

    const [modalOpenStatus, setModalOpenStatus] = useState<typeof TYPE_MODAL[keyof typeof TYPE_MODAL]>(TYPE_MODAL.closed)

    const closeModal = () => setModalOpenStatus(TYPE_MODAL.closed)
    const openModal = () => setModalOpenStatus(TYPE_MODAL.opened)

    const isModalOpen = modalOpenStatus !== TYPE_MODAL.closed

    const closeModalWrapper = (cb: Function): MouseEventHandler<HTMLButtonElement>  => e => {
        debugger
        e.stopPropagation()
        cb()
        closeModal()
    }

    const onCardClick: MouseEventHandler<HTMLDivElement> = e => {
       if (usable) {
            e.stopPropagation()
            openModal()
       }
    }

    const handleSummon = closeModalWrapper(summon)
    const handleActivate = closeModalWrapper(activate)

    return (
        <SelectiveElementComponent element={card}>
            <div className={`w-28 h-24 rounded-lg flex `} onClick={onCardClick}>
                <MobDataCardComponent mobData={mobData} />
                { isModalOpen && (
                    <div className="absolute left-5 flex flex-col">
                        <button onClick={handleActivate}>
                            Активировать
                        </button>
                        <button onClick={handleSummon}>
                            Призвать
                        </button>
                    </div>
                ) }
            </div>
        </SelectiveElementComponent>
    )
    return 
}
