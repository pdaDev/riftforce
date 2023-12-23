import { FC } from "react"
import { Turn, User, UserDraft } from "../Classes/Class"
import { GuildsListComponent } from "./GuildsListComponents"
import { UserComponent } from "./UserComponent"
import { observer } from "mobx-react-lite"

interface IProps {
    draft: UserDraft
    user: User
    hasBan: boolean
    turn: Turn
}

export const UserDraftComponent: FC<IProps> = observer(
    ({ draft, user, hasBan, turn }) => {
        const { chosen, banned } = draft
        const hasTurn = user === turn.currentTurn

        return (
            <div>
                <UserComponent user={user} hasTurn={hasTurn} />
                <GuildsListComponent guilds={chosen} />
                {hasBan && <GuildsListComponent guilds={banned} />}
            </div>
        )
    }
)
