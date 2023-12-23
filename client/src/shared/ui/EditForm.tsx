import { LoadingButton } from "@mui/lab"
import { Button, Stack } from "@mui/material"
import { FC, FormEventHandler, ReactNode } from "react"
import SaveIcon from '@mui/icons-material/Save';
import { useStore } from "../../app/store";

interface IProps {
    onClose: Function
    onSubmit: FormEventHandler<HTMLFormElement>
    children: ReactNode
    disabled?: boolean
    loading?: boolean
    hasChanges?: boolean
    notifyAboutChanges?: boolean
    submitButtonLabel?: string
    declineButtonLabel?: string
    loadingStatusLabel?: string
}

export const EditForm: FC<IProps> = (
    { 
        children,
        disabled,
        loading,
        onClose,
        onSubmit, 
        hasChanges,
        notifyAboutChanges,
        submitButtonLabel,
        declineButtonLabel,
        loadingStatusLabel,
    }) => {

    const { openModal } = useStore().layout.popups

    const onDeclineChanges = () => {
        if (hasChanges && notifyAboutChanges) {
            openModal({
                key: 'decline-changes',
                payload: {
                    onConfirm: onClose
                }
            })
        } else {
            onClose()
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack gap={2}>
            { children }
            </Stack>
            <Stack 
                direction="row-reverse" 
                gap={2} 
                sx={{ mt: 2 }}
            >
                { loading
                    ? <LoadingButton
                        loading
                        type="button"
                        loadingPosition="start"
                        startIcon={<SaveIcon />}
                        variant="outlined"
                    >
                            { loadingStatusLabel || 'Сохранение' }
                    </LoadingButton>
                    : <Button 
                        disabled={disabled} 
                        type='submit' 
                        variant={'contained'}
                    >
                            { submitButtonLabel || 'Сохранить' }
                    </Button>               }
                <Button 
                    disabled={loading} 
                    onClick={onDeclineChanges} 
                    type="button"
                    variant="outlined"
                >
                    { declineButtonLabel || 'Отменить' }  
                </Button>
            </Stack>
        </form>
    )
}