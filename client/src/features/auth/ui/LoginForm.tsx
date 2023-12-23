import { CardContent, Link, Paper, Stack, TextField, Typography } from "@mui/material"
import { FC } from "react"
import { useForm } from "react-hook-form"
import { loginFormSchema, useAuth } from ".."
import { RequestKeys, UserCredentials } from "../namespace"
import { yupResolver } from '@hookform/resolvers/yup'
import LoadingButton from '@mui/lab/LoadingButton';
import { observer } from "mobx-react-lite"
import { PasswordInput } from "../../../shared/ui/PasswordInput"

interface IProps {
    goToRegister: () => void
}

export const LoginForm: FC<IProps> = observer(({ goToRegister }) => {
    const { register, handleSubmit, resetField, setError, formState: { errors } } = useForm<UserCredentials>({
        resolver: yupResolver(loginFormSchema)
    })
    
    const { login, loadings } = useAuth()
    const loading = loadings[RequestKeys.login]

    const onFormSubmit = (data: UserCredentials) => {
        login(data).catch(() => {
            resetField('password')
            setError('email', {
                message: 'Неверный адрес электронной почты или пароль'
            })
        })
    }

    return (
        <Paper sx={{ m: 2 }}>
            <CardContent>
                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <Stack gap={2}>
                        <Typography
                            variant="h4" 
                            textAlign="center"
                        >
                            Войти
                        </Typography>
                        <TextField
                            {...register('email')}
                            label="Адрес электронной почты" 
                            size="medium"
                            error={!!errors.email?.message}
                            helperText={errors.email?.message}
                        /> 
                        <PasswordInput register={register('password')} />
                        <Stack 
                            direction={'row'} 
                            gap={2}
                        >
                            <Typography
                                fontWeight="light"
                            >
                                Еще нет аккаунта? 
                            </Typography>
                            <div onClick={goToRegister}>
                                <Link variant="button">
                                    Зарегистрироваться
                                </Link>
                            </div>
                        </Stack>
                        <LoadingButton 
                            type="submit" 
                            variant="contained" 
                            sx={{ mt: 2 }} 
                            loading={loading}
                        >
                            { loading ? 'Вход' : 'Войти' }
                        </LoadingButton>
                    </Stack>
                </form>
            </CardContent>
        </Paper>
    )
})