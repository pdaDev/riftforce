import { FC, ReactNode, useEffect } from "react";
import { useStore } from "../../../app/store";
import { useLayoutStore } from "../../../app/services/commonLayout";
import { observer } from "mobx-react-lite";

interface IProps {
    children: ReactNode
}

export const ErrorBoundary: FC<IProps> = observer(({ children }) => {
    const { totalError } = useStore().errors
    const { hideFooterAndHeader } = useLayoutStore()

    useEffect(() => {
        if (totalError && totalError.disabled) {
            hideFooterAndHeader()
        }
    }, [totalError])

    if (!totalError) {
        return children
    }

    const { message, code } = totalError

    return <div className="w-full h-full min-h-full flex items-center justify-center">
        <div className="p-6 rounded-lg shadow-lg flex justify-center items-center gap-4 flex-col">
            <h1 className="text-6xl">
                { code }
            </h1>
            <p>
                { message }
            </p>
        </div>
    </div>
})