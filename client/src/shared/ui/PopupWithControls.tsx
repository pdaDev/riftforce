import { FC, ReactNode } from "react"
import { BasePopup } from "."
import { Button } from "@mui/material"


interface IProps {
    controls?: ReactNode[]
    children: ReactNode
    onSubmit: () => void
    onDecline: () => void
    submitTitle?: string
    declineTitle?: string
    title: string
    disabled?: boolean
    className?: string
    loading?: boolean
}

export const PopupWithControls: FC<IProps> = (
    { 
        title,
        controls,
        children,
        onDecline,
        onSubmit,
        submitTitle,
        declineTitle,
        disabled,
        loading,
        className
     }
    ) => {
    const popupControls: ReactNode[] = controls || [
        <Button onClick={onDecline} disabled={loading}>
            { declineTitle || 'Отменить' }
        </Button>,
        <Button variant={'contained'} onClick={onSubmit} disabled={disabled || loading}>
            { submitTitle || 'Принять' }
        </Button>
    ]

    return <BasePopup title={title}
                      className={className}
    >
        <div>
            { children }
            <div className="mt-4 flex justify-end gap-3">
                { popupControls }
            </div>
        </div>
    </BasePopup>
}