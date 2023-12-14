import { FC, ReactNode } from "react";
import { SelectiveElement } from "../Classes/Class";
import { observer } from "mobx-react-lite";


interface IProps {
    children: ReactNode
    element: SelectiveElement
}

export const SelectiveElementComponent: FC<IProps> = observer(
    ({ element, children }) => {
        const { highlighted, onSelect } = element

        return (
            <div className={`border-2  shadow-md rounded-lg ${highlighted ? 'cursor-pointer border-amber-300' : 'border-transparent'}`} 
                 onClick={onSelect}
            >
                { children }
            </div>
        )
    }
)