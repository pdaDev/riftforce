import { FC, ReactNode } from "react"

interface IProps {
    title: string
    value?: string | number
    children?: ReactNode
}

export const GameProp: FC<IProps> = ({ title, value, children }) => {
    return <div className="flex items-center flex-col gap-3">
        <h3>
            { title }
        </h3>
        { children || <h3>
            { value }
        </h3> }
    </div>
}

