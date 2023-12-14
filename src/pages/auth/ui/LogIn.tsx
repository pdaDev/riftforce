import { Box, Stack } from "@mui/material";
import { useStore } from "../../../app/store";
import { useAppNavigate } from "../../../app/services/routes";
import { LoginForm } from "../../../features/auth";
import { FC, useEffect } from "react";
import { useTabTile } from '../../../shared'

export const LogIn: FC = () => {
    const { showFooterAndHeader, hideFooterAndHeader } = useStore().layout
    const n = useAppNavigate()

    useTabTile("Вход")
    
    useEffect(() => {
        hideFooterAndHeader()
        return showFooterAndHeader
    }, [])

    const goToRegister = () => n(p => p.signup)

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
                <LoginForm goToRegister={goToRegister}/>
            </Box>
        </Stack>
    )
}