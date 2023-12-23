import { Skeleton } from "@mui/material";
import { FC } from "react";

interface IProps {
    src: string | null
    loading?: boolean
}

export const UserAvatar: FC<IProps> = ({ src, loading }) => {
    if (loading) {
        return<Skeleton variant="circular" width={20} height={20} />
    }

    return <img src={src || ''}  />
}