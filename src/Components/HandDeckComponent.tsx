import { FC } from "react";
import { Card, Deck } from "../Classes/Class";
import { CardComponent } from "./CardComponent";

interface IProps {
    deck: Deck<Card>
}

export const HandDeckComponent: FC<IProps> = ({ deck }) => {
    return <div className="flex w-full justify-center ">
        <div className="flex gap-2">
            { deck.cards.map(card => <CardComponent card={card} key={card.mobData.code} />) }
        </div>
    </div>
}