import { CSSProperties, FC, MouseEventHandler, useState } from "react"
import { Card } from "../Classes/Class"
import { MobDataCardComponent } from "./MobDataCardComponent"
import { SelectiveElementComponent } from "./SelectiveElementComponent"
import { useBlurFocus } from "../shared"
import { observer } from "mobx-react-lite"

interface IProps {
    hidden?: boolean
    card?: Card
    className?: string
    style?: CSSProperties
    showContent?: boolean
}

const TYPE_MODAL = {
    opened: "OPENED",
    closed: "CLOSED",
    summon: "SUMMON",
    activate: "ACTIVATE",
} as const

export const CardComponent: FC<IProps> = observer(
    ({ card, hidden, showContent, ...pos }) => {
        if (!card || hidden) {
            return <div></div>
        }

        const { mobData, usable, summon, activate } = card

        const [modalOpenStatus, setModalOpenStatus] = useState<
            (typeof TYPE_MODAL)[keyof typeof TYPE_MODAL]
        >(TYPE_MODAL.closed)

        const closeModal = () => setModalOpenStatus(TYPE_MODAL.closed)
        const openModal = () => setModalOpenStatus(TYPE_MODAL.opened)

        const isModalOpen = modalOpenStatus !== TYPE_MODAL.closed

        const closeModalWrapper =
            (cb: Function): MouseEventHandler<HTMLButtonElement> =>
            (e) => {
                e.stopPropagation()
                cb()
                closeModal()
            }

        const onCardClick: MouseEventHandler<HTMLDivElement> = (e) => {
            if (usable && card.clickable) {
                e.stopPropagation()
                openModal()
            }
        }

        const { onBlur, onFocus } = useBlurFocus(closeModal)
        const handleSummon = closeModalWrapper(summon)
        const handleActivate = closeModalWrapper(activate)

        return (
            <div {...pos}>
                <SelectiveElementComponent element={card}>
                    <div
                        tabIndex={0}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        className={`w-48 h-64 flex items-center bg-white shadow-md h-64 relative shadow-md rounded-lg flex ${
                            !showContent && "border-amber-500 border-8"
                        } `}
                        onClick={onCardClick}>
                        {showContent ? (
                            <MobDataCardComponent mobData={mobData} />
                        ) : (
                            <h2>RIFTFORCE</h2>
                        )}
                        {isModalOpen && (
                            <div className="absolute -top-14 bg-slate-100 rounded-lg left-0 w-full flex items-center flex-col">
                                <button onClick={handleActivate}>
                                    Активировать
                                </button>
                                <button onClick={handleSummon}>Призвать</button>
                            </div>
                        )}
                    </div>
                </SelectiveElementComponent>
            </div>
        )
        return
    }
)
