import { createContext } from "react"
import { CommonLayoutStore } from "../../services/commonLayout"
import { AuthUserController } from "../../../features/auth/model/store"
import { GamePlayer, GameState, ServiceWrapper, WithCurrentUserServiceWrapper } from "../../../Classes/Class"
import { EntityController } from "../../../shared"
import { ServerRoomCard } from "../../../entities/room"
import { RoomsAPI } from "../../../features/rooms"
import { ErrorCatcherService } from "../../../shared"


const authStore = AuthUserController.getInstance()

export const store = {
    layout: new CommonLayoutStore(),
    auth: authStore,
    room: new WithCurrentUserServiceWrapper<GameState>(authStore),
    player: new ServiceWrapper<GamePlayer>(),
    roomsSearch: new EntityController<ServerRoomCard>({
        api: new RoomsAPI(),
        key: 'rooms',
    }),
    errors: ErrorCatcherService.getInstance()
} as const


export const Context = createContext(store)
