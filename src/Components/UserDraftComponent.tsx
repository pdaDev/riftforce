import { FC } from "react";
import { User, UserDraft } from "../Classes/Class";
import { GuildsListComponent } from "./GuildsListComponents";
import { UserComponent } from "./UserComponent";

interface IProps {
    draft: UserDraft
    user: User
}

export const UserDraftComponent: FC<IProps> = ({ draft, user }) => {
    const { chosen, banned } = draft

    return <div>
        <UserComponent user={user} />
        <GuildsListComponent guilds={chosen} />
        <GuildsListComponent guilds={banned} />
    </div>
}