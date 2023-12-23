import { Box, Button, Stack } from "@mui/material"
import { FC } from "react"
import { useAppNavigate } from "../../../app/services/routes"
import { UserMenu } from "../../../features/auth"
import { usePopupsStore } from "../../popups"
import { CreateRoomButton } from "../../../features/rooms"

export const Header: FC = () => {
    const n = useAppNavigate()
    const goToLogin = () => n((p) => p.login)
    const goToHome = () => n((p) => p.home)
    const { openModal } = usePopupsStore()
    const openLocalStart = () => openModal({ key: "local-play", payload: null })

    return (
        <header className="mb-12">
            <Box
                sx={{
                    height: "56px",
                    boxShadow: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.paper",
                }}>
                <Stack
                    direction={"row"}
                    alignItems={"center"}
                    width={"100%"}
                    maxWidth={1320}
                    mx={5}
                    justifyContent={"space-between"}>
                    <div onClick={goToHome}>RIFTFORCE</div>
                    <Stack direction="row-reverse" width={"100%"} spacing={3}>
                        <UserMenu goToLogin={goToLogin} />
                        <CreateRoomButton />
                        <Button onClick={openLocalStart}>
                            Играть локально
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </header>
    )
}
