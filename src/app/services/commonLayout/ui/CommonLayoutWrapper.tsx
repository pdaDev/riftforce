import { Container, Card, CircularProgress, Stack } from "@mui/material"
import { observer } from "mobx-react-lite"
import { ReactNode, FC } from "react"
import { useAutoAuth } from "../../../../features/auth"
import { Header, Footer } from "../../../../widgets/layout"
import { NotificationsContainer } from "../../../../widgets/notifications"
import { PopupsContainer } from "../../../../widgets/popups"
import { useStore } from "../../../store"
import { ErrorBoundary } from "../../../../widgets/errors"


interface IProps {
    children: ReactNode
}

export const CommonLayoutWrapper: FC<IProps> = observer(({ children }) => {
    useAutoAuth()
    const { headerShowed, footerShowed, initialized } = useStore().layout
    
    if (!initialized) {
        return (
          <Container sx={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Card sx={{ p: 2 }}>
                <CircularProgress />
            </Card>
        </Container>
        )
    }

    return (
        <>
            <Stack
                direction={'column'}
                width={'100%'}
                minHeight={'100%'}
                gap={4}
                justifyContent={'space-between'}
            >
                <div>
                    { headerShowed && <Header/> }
                    <Container sx={{pt: 2}}>
                     <ErrorBoundary>
                        { children }
                     </ErrorBoundary>
                    </Container>
                </div>
            { footerShowed && <Footer/> }
            </Stack>
            <PopupsContainer />
            <NotificationsContainer/>   
        </>
        
    )
    
})

