import { LogIn, SignUp } from "../../../../pages/auth";
import { Billboard } from "../../../../pages/dashboard";
import { Player } from "../../../../pages/player/ui/Player";
import { MyGames, PersonalStatistics, Profile } from "../../../../pages/profile";
import { Room, RoomsList } from "../../../../pages/rooms";
import { PermissionType } from "../../../../shared";
import {formatTree} from "../lib/helpers";
 
export default formatTree({
    home: {
        permission: PermissionType.authorized,
        component: <RoomsList/>
    },
    rooms: {
         permission: PermissionType.authorized,
        _key_: {
            __path__: 'id',
            component: <Room/>
        },
    },
    me: {
        lazy: true,
        component: <Profile/>,
        permission: PermissionType.authorized,
        recentGames: {
            lazy: true,
            component: <MyGames/>,
        },
        statistic: {
            lazy: true,
            component: <PersonalStatistics/>,
        },
    },
    player: {
        component: <Player/>,
        lazy: true
    },
    billboard: {
        component: <Billboard/>,
        lazy: true
    },
    login: {
        permission: PermissionType.unauthorized,
        component: <LogIn/>,
        lazy: true
    },
    signup: {
        permission: PermissionType.unauthorized,
        lazy: true,
        component: <SignUp/>,
    }
});




