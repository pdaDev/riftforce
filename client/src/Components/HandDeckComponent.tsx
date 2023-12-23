import { FC } from "react"
import { Card } from "../Classes/Class"
import { CardComponent } from "./CardComponent"
import styled, { css } from "styled-components"
import { observer } from "mobx-react-lite"

interface IProps {
    cards: Card[]
    showCards?: boolean
    reversed?: boolean
}

const CardWrapper = styled.div<{
    yOffset: number
    xOffset: number
    angle: number
    canHover: boolean
}>`
    transform: ${({ angle, xOffset, yOffset }) => {
        return ` translateY(-${yOffset}px)  translateX(-${xOffset}px)
        rotate(${angle}deg);`
    }};

    transition: 200ms;

    ${({ angle, xOffset, yOffset, canHover }) =>
        canHover &&
        css`
    &:hover {
        transform: translateY(-${yOffset + 50}px)  translateX(-${xOffset}px)
        rotate(${angle}deg);
    `}

   
    }
`

export const HandDeckComponent: FC<IProps> = observer(
    ({ cards, showCards, reversed = false }) => {
        const cardWidth = 212
        const cardsYOffset = cardWidth / 2
        const centerIndex = (cards.length - 1) / 2
        const maxAngle = 20
        const totalWidth = 800
        const cardsXOffset =
            (cards.length * cardWidth - totalWidth) /
            Math.max(1, cards.length - 1)

        const calculateAngle = (i: number) => {
            return -1 * ((centerIndex - i) / centerIndex) * maxAngle
        }

        const getOffset = (i: number) => {
            return Math.abs(
                Math.cos(
                    (calculateAngle(i) / 57.3) *
                        (2.5 + 1.5 * (1 - cards.length / 7))
                ) * cardsYOffset
            )
        }

        return (
            <div
                style={{
                    width: 500,
                    transform: ` rotate(${
                        reversed ? "180" : "0"
                    }deg) translateX(-${cardsXOffset}px) translateY(${cardsYOffset}px) `,
                    display: "flex",
                }}>
                {cards.map((card, i) => (
                    <CardWrapper
                        canHover={!!showCards}
                        xOffset={i * cardsXOffset}
                        angle={calculateAngle(i)}
                        yOffset={getOffset(i)}>
                        <CardComponent
                            card={card}
                            showContent={showCards}
                            key={card.mobData.code}
                        />
                    </CardWrapper>
                ))}
            </div>
        )
    }
)
