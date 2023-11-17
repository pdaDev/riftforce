import { FC, MouseEventHandler, ReactNode } from "react";
import { SelectiveElement } from "../Classes/Class";
import { observer } from "mobx-react-lite";


interface IProps {
    children: ReactNode
    element: SelectiveElement
}

export const SelectiveElementComponent: FC<IProps> = observer(
    ({ element, children }) => {
        const { highlighted, select } = element

        return (
            <div className={`border-2  ${highlighted && 'cursor-pointer border-red-300'}`} 
                 onClick={select as MouseEventHandler}
            >
                { children }
            </div>
        )
    }
)