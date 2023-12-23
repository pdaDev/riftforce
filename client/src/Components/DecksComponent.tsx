import { FC } from "react"
import { CardsController } from "../Classes/Class"

import { observer } from "mobx-react-lite"
import { HandDeckComponent } from "./HandDeckComponent"

interface IProps {
    controller: CardsController
    showCards: boolean
    enableDraw: boolean
    reversed?: boolean
}

export const DecksComponent: FC<IProps> = observer(
    ({ controller, showCards = true, enableDraw, reversed = false }) => {
        const {
            hand: { cards: hand },
            canDraw,
            makeDraw,
        } = controller

        const showDrawButton = canDraw && showCards && enableDraw
        return (
            <div style={{}} className="flex w-full relative  justify-center ">
                <HandDeckComponent
                    cards={hand}
                    showCards={showCards}
                    reversed={reversed}
                />
                {showDrawButton && (
                    <button
                        className="p-3 border-2 absolute -top-24 border-amber-200"
                        onClick={makeDraw}>
                        Добор
                    </button>
                )}
            </div>
        )
    }
)
