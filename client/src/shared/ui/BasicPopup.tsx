import { FC, ReactNode } from "react";
import { Label } from "./Label";

interface IProps {
    title: string
    className?: string
    children: ReactNode 
}

export const BasePopup: FC<IProps> = ({ title, children, className }) => {
    return <div className={className}>
        <Label variant="h2" value={title} className="mb-3"/>
        { children }
    </div>
}