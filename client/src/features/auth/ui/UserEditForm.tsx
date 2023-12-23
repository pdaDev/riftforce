import { Card, CardContent, Stack, TextField } from "@mui/material";
import { userDataEditFormSchema } from "../lib";
import { EditUserPayload } from "../namespace";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { EditForm, getObjectKeys } from "../../../shared"
import { UserAvatarLoader } from "./UserAvatarLoader";
import { yupResolver } from '@hookform/resolvers/yup'
import { AuthUser } from "../../../Classes/Class";

interface IProps {
    onClose: () => void
    loading: boolean
    user: AuthUser
    edit: (payload: EditUserPayload) => Promise<void>
}

type FormState = Omit<EditUserPayload, 'avatar' >

export const UserEditForm: FC<IProps> = ({ onClose, loading, user, edit }) => {
    const [avatar, setAvatar] = useState<null | File| string>(user!.avatar)
 
    const { handleSubmit, register, getValues, watch, formState: { errors } } = useForm<FormState>({
        defaultValues: {
            name: user!.name
        },
        resolver: yupResolver(userDataEditFormSchema)
    })

    const hasChanges = (user ? getObjectKeys(getValues()).some(key => watch(key) !== user[key]) : false ) || avatar !== user?.avatar

    const onFormSubmit = (formData: FormState) => {
        edit({
            ...formData,
            avatar: avatar !== user?.avatar ? avatar as (File | null) : undefined
        }).then(onClose)
    }

    return (
        <Card sx={{maxWidth: 900}}>
            <CardContent>
                <EditForm   
                    onSubmit={handleSubmit(onFormSubmit)}  
                    disabled={loading}
                    notifyAboutChanges
                    hasChanges={hasChanges}
                    onClose={onClose}
                >
                    <Stack 
                        direction={'row'} 
                        gap={3}
                    >
                        <UserAvatarLoader 
                            onLoad={setAvatar}
                            avatar={avatar}
                        />
                        <Stack 
                            gap={2} 
                            width={'100%'}
                        >
                            <TextField 
                                {...register('name')}
                                label="Имя" 
                                error={!!errors.name?.message}
                                helperText={errors.name?.message}
                            /> 
                        </Stack>
                    </Stack>
                </EditForm>
            </CardContent>
        </Card>
    )
}