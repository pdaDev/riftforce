import * as yup from 'yup'
import * as NS from '../namespace'

yup.setLocale({
    string: {
        email: 'Неверный адрес электронной почты',
        min: 'Минимальная длина составляет ${min}',
        max: 'Максимальная длина составляет ${max} символов'
    },
    mixed: {
        required: 'Это поле обязательное'
    }
})

const loginSchemaObject = {
    email: yup.string().email().required().defined(),
    password: yup.string().required().defined(),
}

const userDataSchemaObject = {
    name: yup.string()
    .matches(/^[а-яА-Яa-zA-Z]/, 'Только буквы русского или английского алфавита').
    max(100).required().defined(),
}

export const loginFormSchema: yup.ObjectSchema<NS.UserCredentials> = yup.object(loginSchemaObject)

export const registerFormSchema: yup.ObjectSchema<NS.RegisterPayload> = yup.object({
     ...loginSchemaObject,
     ...userDataSchemaObject,   
    repeatedPassword: yup.string().defined()
    .oneOf([yup.ref('password')], 'Пароли должны совпадать')    
   
})

export const userDataEditFormSchema: yup.ObjectSchema<Omit<NS.EditUserPayload, 'avatar'>> = yup.object({
    ...userDataSchemaObject
})