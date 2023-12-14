import { Skeleton, TextField } from "@mui/material";
import { ChangeEventHandler, FC, KeyboardEventHandler, useEffect, useRef, useState } from "react";
import * as yup from 'yup'
import { Label } from "./Label";
import { LabelVariant } from "..";

interface IProps {
    value: string | null
    onSubmit: (value: string) => void
    loading?: boolean
    showLoadingAnyTime?: boolean
    canEdit?: boolean
    variant?:  LabelVariant
    validator?: yup.Schema
}

export const TitleAutoInput: FC<IProps> = ({
    value,
    variant = 'h2',
    loading,
    showLoadingAnyTime,
    onSubmit,
    canEdit = true,
    validator
    
}) => {
    const ref = useRef(false)
    const initialized = ref.current
    const [isEditMode, setEditMode] = useState(false)
    const [currentValue, setCurrentValue] = useState(value || '')
    const [validationError, setValidationError] = useState<undefined | string>()

    const isValid = !validationError

    useEffect(() => {
        if (!loading && currentValue && !initialized) {
            ref.current = true
        }
    }, [loading, currentValue])

    useEffect(() => {
        if (initialized && !loading && value) {
            setCurrentValue(value || '')
        }
    }, [initialized, loading, value])

    const onCurrentValueChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
        const value = e.target.value
        setCurrentValue(value)
    
        if (validator) {
            try {
                validator.validateSync(value)
                setValidationError(undefined)
            } catch (err: any) {
                setValidationError(err.message)
            }
        }
    }

    const closeEditMode = () => {
        if (currentValue !== value && isValid) {
            onSubmit(currentValue)
        }
        
        setEditMode(false)
    }

    const activateEdit = () => canEdit && setEditMode(true)

    const showLoading = showLoadingAnyTime || (!initialized && loading)

    if (showLoading) {
        return <Skeleton variant="rectangular" />
    }

    const onTextFieldKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.code === 'Enter') {
            closeEditMode()
        }
    }

    return <>
    {
        isEditMode
            ? <TextField onChange={onCurrentValueChange}
                     onBlur={closeEditMode}
                     onKeyDown={onTextFieldKeyDown}
                     value={currentValue}
               />
            : <Label variant={variant}
                     onDoubleClick={activateEdit}
                     loading={loading}
                     value={currentValue}
              />    
            }
    </>
}