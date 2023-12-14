import { FC } from "react";
import { useForm } from "react-hook-form";
import { RegisterPayload, RequestKeys } from "../namespace";
import { yupResolver } from '@hookform/resolvers/yup' 
import { CardContent, FormControlLabel, Link, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import { registerFormSchema, useAuth } from "..";
import { useToggle } from "../../../shared";
import LoadingButton from '@mui/lab/LoadingButton';
import { observer } from "mobx-react-lite";

type UserRegisterForm =  RegisterPayload & {
    repeatedPassword: string
}

interface IProps {
    goToLogin: () => void
}

export const RegisterForm: FC<IProps> = observer(({ goToLogin }) => {

    const { handleSubmit, register, resetField, formState: { errors } } = useForm<UserRegisterForm>({
        resolver: yupResolver(registerFormSchema as any),
        mode: 'onChange',
    })

    const [showedPassword, togglePasswordStatus] = useToggle()

    const { register: registerUser, loadings } = useAuth()
    const loading = loadings[RequestKeys.register]

    const resetPassword = () => {
        resetField('password')
        resetField('repeatedPassword')
    }

    const onFormSubmit = (data: UserRegisterForm) => {
        registerUser(data).catch(resetPassword)
    }

    return (
        <Paper sx={{ m: 2 }}>
            <CardContent>
                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <Stack gap={2}>
                        <Typography variant="h4">
                            Зарегистрироваться
                        </Typography>
                        <TextField
                            {...register('email')}
                            label="Адрес электронной почты" 
                            error={!!errors.email?.message}
                            helperText={errors.email?.message}
                        /> 
                        <TextField
                            {...register('name')}
                            label="Имя" 
                            error={!!errors.name?.message}
                            helperText={errors.name?.message}
                        /> 
                       
                        <FormControlLabel 
                            control={
                                <Switch 
                                    checked={showedPassword}
                                    onClick={togglePasswordStatus} />} 
                            label="Показать пароль" 
                        />
                        <TextField 
                            {...register('password')}
                            label="Пароль" 
                            type={showedPassword ? 'text' : 'password'}
                            error={!!errors.password?.message}
                            helperText={errors.password?.message}
                        /> 
                        <TextField 
                            {...register('repeatedPassword')}
                            label="Повторите пароль" 
                            type={showedPassword ? 'text' : 'password'}
                            error={!!errors.repeatedPassword?.message}
                            helperText={errors.repeatedPassword?.message}
                        /> 
                        <Stack 
                            gap={2} 
                            direction="row"
                        >
                            <Typography fontWeight="light">
                                Уже есть аккаунт? 
                            </Typography>
                            <div onClick={goToLogin}>
                                <Link variant="button">
                                    Войти
                                </Link>
                            </div>
                        </Stack>
                        <LoadingButton
                            loading={loading}
                            sx={{ mt: 2 }}
                            variant="contained"
                            type="submit"
                        >
                                Зарегистрироваться
                        </LoadingButton>
                    </Stack>
                </form>
            </CardContent>
        </Paper>
    )
})