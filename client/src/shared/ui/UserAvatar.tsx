import { FC } from "react";
import { ElemSize } from "..";
import { Avatar } from "@mui/material";

interface IProps {
    size?: ElemSize
    src: null | string
}

export const UserAvatar: FC<IProps> = ({ src }) => {
    return <Avatar src={src || ''} />
}