import { FC } from "react";
import { User } from "../Classes/Class";
import { UserAvatar } from "./UserAvatar";

interface IProps {
    user: User
}

export const UserComponent: FC<IProps> = ({ user }) => {
    const { avatar, name } = user
    
    return (
    <div className="flex items-center gap-4"> 
        <UserAvatar src={avatar} />
        <h3 className="font-semibold text-md ">
            { name }
        </h3>
    </div>
    )
}