import { FC, MouseEventHandler, useState } from "react";
import { useAuth } from "..";
import { Button, Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { UserAvatar } from "../../../shared";
import { useAppNavigate } from "../../../app/services/routes"
import { observer } from "mobx-react-lite";
import LogoutIcon from '@mui/icons-material/Logout';
import FaceIcon from '@mui/icons-material/Face';

interface  IProps {
    goToLogin: () => void
}

export const UserMenu: FC<IProps> = observer(({ goToLogin }) => {
    const { isAuthorized, logout, user } = useAuth()
    const n = useAppNavigate()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const onMenuClick: MouseEventHandler<HTMLDivElement> = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const onMenuClose = () => [
        setAnchorEl(null)
    ]
    
    const goToProfile = () => n(p => p.me)

    if (!isAuthorized) {
        return (
            <Button 
                title="Войти" 
                onClick={goToLogin} 
                variant="outlined"
            >
                Войти
            </Button>
        )
    }

    return <>
        <div onClick={onMenuClick}>
            <UserAvatar src={user?.avatar!} />
        </div>
        <Menu
            anchorEl={anchorEl}
            open={open}
            sx={{
                mt: 2
            }}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            onClose={onMenuClose}
        >
            <MenuItem onClick={goToProfile}>
                <ListItemIcon>
                    <FaceIcon/>
                </ListItemIcon>
                <ListItemText>
                    Профиль
                </ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={logout}>
                <ListItemIcon>
                    <LogoutIcon/>
                </ListItemIcon>
                <ListItemText>
                    Выйти
                </ListItemText>
            </MenuItem>
        </Menu>
    </>
})