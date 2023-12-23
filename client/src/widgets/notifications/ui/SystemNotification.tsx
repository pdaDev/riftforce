import { FC, ReactNode } from "react"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { NotificationWrapper } from "./NotificationWrapper";
import { NotificationVariant } from "../../../shared";

interface IProps {
    variant: NotificationVariant
    title: string | null
    message?: string
    close: () => void
}

export const SystemNotification: FC<IProps> = ({ variant, close, title, message }) => {
    const iconByVariant: Record<NotificationVariant, ReactNode> = {
        [NotificationVariant.success]: <CheckCircleOutlineIcon fontSize="large" color="success"/>,
        [NotificationVariant.error]: <ErrorOutlineIcon fontSize="large" color="error"/>,
        [NotificationVariant.warning]: <WarningAmberIcon fontSize="large" color="warning"/>
    }

    return <NotificationWrapper close={close}>
        { iconByVariant[variant] }
       <div className="ml-3">
            { title && <h2 className="text-md font-semibold">
                { title }
            </h2> }
            { message && <p className="p-0 m-0 text-sm font-light">
                { message }
            </p> }
       </div>
    </NotificationWrapper>
}