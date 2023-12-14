import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { FormControl, InputLabel, InputAdornment, IconButton,  OutlinedInput } from "@mui/material";
import { ChangeEventHandler, FC, useEffect, useState } from "react";

interface IProps {
    hideIcon?: boolean
    showPassword?: boolean
    register?: any
    value?: string
    error?: string
    onChange?: (data: string) => void
}
 
export const PasswordInput: FC<IProps> = ({ showPassword, register, error, value, hideIcon = false, onChange }) => {
    const [passwordShowed, setPasswordShowStatus] = useState(false)

    const onPasswordShowButtonMouseDown = () => {
        setPasswordShowStatus(true)
    }

    const onPasswordShowButtonMouseUP = () => {
        setPasswordShowStatus(false)
    }

    useEffect(() => {
        if (showPassword !== undefined ) {
            setPasswordShowStatus(showPassword)
        }
    }, [showPassword])

    const registerObject = register || {}

    const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        onChange && onChange(e.target.value)
    }
    return (
            <FormControl>
                <InputLabel htmlFor="password-input">
                    Пароль
                </InputLabel>
                <OutlinedInput  
                     value={value}
                     onChange={onPasswordChange}
                    {...registerObject}
                    helperText={error}
                    error={!!error}
                    label="Пароль"
                    id="password-input"
                    type={passwordShowed ? 'text'  : 'password' }
                    endAdornment={
                        !hideIcon && <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onMouseDown={onPasswordShowButtonMouseDown}
                            onMouseUp={onPasswordShowButtonMouseUP}
                        >
                            {passwordShowed ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
    
                    }
                /> 
            </FormControl>
    )      
}