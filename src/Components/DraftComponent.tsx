import { FC, ReactNode, useMemo } from "react";
import { Draft } from "../Classes/Class";
import { TurnComponent } from "./TurnComponent";
import { GuildsPoolComponent } from "./GuildsPoolComonent";
import { UserDraftComponent } from "./UserDraftComponent";
import { observer } from "mobx-react-lite";

interface IProps {
    draft: Draft
}

export const DraftComponent: FC<IProps> = observer(({ draft }) => {
    const { turn, usersDraft, guilds } = draft

    const usersDraftsNodes = useMemo(() => {
        const userDraftsComponents: ReactNode[] = []
    
        for (let [user, draft] of usersDraft.entries()) {
            userDraftsComponents.push(<UserDraftComponent user={user} draft={draft}  key={user.id} />)
        }

        return userDraftsComponents
    }, [usersDraft])

    return (
     <div>
        <TurnComponent turn={turn} />
        { usersDraftsNodes }
        <GuildsPoolComponent pool={guilds} />
    </div>
    )
})