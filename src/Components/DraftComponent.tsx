import { FC, ReactNode, useMemo } from "react";
import { Draft, DraftStage } from "../Classes/Class";
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
    
        for (let [user, guilds] of usersDraft.entries()) {
            userDraftsComponents.push(
            <UserDraftComponent 
                hasBan={draft.hasBanStage}
                user={user}
                currentTurn={turn.currentTurn}
                draft={guilds}
                key={user.id}
             />)
        }

        return userDraftsComponents
    }, [usersDraft])

    const stageName: Record<DraftStage, string> = {
        [DraftStage.ban]: 'Бан',
        [DraftStage.pick]: 'Пик'
    }

    return (
     <div>
        { draft.hasBanStage ? stageName[draft.currentStage] : null }
        <div className="rounded-lg flex flex-col gap-2 mb-5 bg-white shadow-md w-fit p-4 ">
        { usersDraftsNodes }
        </div>
        <GuildsPoolComponent pool={guilds} />
    </div>
    )
})