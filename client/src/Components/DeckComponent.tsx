import { FC, useState } from "react";
import { Deck } from "../Classes/Class";
import { CardComponent } from "./CardComponent";
import { Backdrop } from "@mui/material";
import { MobDataCardComponent } from "./MobDataCardComponent";

interface IProps {
    deck: Deck
    canView?: boolean
}

export const DeckComponent: FC<IProps> = ({ deck, canView = false }) => {
    const { size, cards } = deck
    const [showComposition, setShowComposition] = useState(false)

    const onDeckClick = () => {
        if (canView) {
            setShowComposition(true)
        }
    }

    const handleCompositionClose = () => setShowComposition(false)
    
    return <div onClick={onDeckClick}>
        <h2>
            { size }
        </h2>
        <CardComponent />
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={showComposition}
            onClick={handleCompositionClose}
        >
            <div className="grid grid-col-3 container">
                { cards.map(card => <MobDataCardComponent   key={card.code} 
                                                            mobData={card}/>) }
            </div>
        </Backdrop>
    </div>
}
