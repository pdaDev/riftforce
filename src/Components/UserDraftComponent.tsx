import { FC } from "react";
import { User, UserDraft } from "../Classes/Class";
import { GuildsListComponent } from "./GuildsListComponents";
import { UserComponent } from "./UserComponent";

interface IProps {
    draft: UserDraft
    user: User
    hasBan: boolean
    currentTurn: User
}

export const UserDraftComponent: FC<IProps> = (
    { 
        draft,
        user,
        hasBan,
        currentTurn
    }) => {
    const { chosen, banned } = draft
    const hasTurn = user === currentTurn

    return (
        <div>
            <UserComponent user={user}
                           hasTurn={hasTurn}
            />
            <GuildsListComponent guilds={chosen} />
            { hasBan &&  <GuildsListComponent guilds={banned} /> }
        </div>
    )
}