import { FC, ReactNode } from "react";
import CloseIcon from '@mui/icons-material/Close';

interface IProps {
    children: ReactNode
    close: () => void
}

export const NotificationWrapper: FC<IProps> = ({ children, close }) => {
    return (
        <div className="px-8 py-4 z-10 overflow-hidden relative shadow-md rounded-xl flex items-center" tabIndex={0}>
            { children }
            <button onClick={close} className="absolute right-2 top-2">
                <CloseIcon sx={{ width: 18, color: 'GrayText' }}/>
            </button>
        </div>
    )
}