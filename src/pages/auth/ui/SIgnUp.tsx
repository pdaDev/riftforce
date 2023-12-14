import { Stack, Box } from "@mui/material";
import { useStore } from "../../../app/store";
import { useAppNavigate } from "../../../app/services/routes";
import { RegisterForm } from "../../../features/auth";
import { FC, useEffect } from "react";
import { useTabTile } from "../../../shared";

export const SignUp: FC = () => {
    const { showFooterAndHeader, hideFooterAndHeader } = useStore().layout
    const n = useAppNavigate()

    useTabTile("Регистрация")

    useEffect(() => {
        hideFooterAndHeader()
        return showFooterAndHeader
    }, [])

    const goToLogin = () => n(p => p.login)
    
    return (
        <Stack 
            justifyContent={'center'} 
            alignItems={'center'} 
            width={'100%'} 
            height={'100%'}
        >
            <Box 
                m={5} 
                maxWidth={500} 
                width={'100%'}
            >
                <RegisterForm goToLogin={goToLogin}/>
            </Box>
        </Stack>
    )
}