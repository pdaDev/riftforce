import { createContext } from "react"
import { CommonLayoutStore } from "../../services/commonLayout"
import { AuthUserController } from "../../../features/auth/model/store"
import { GamePlayer, GameState } from "../../../Classes/Class"
import { EntityController, WithCurrentUserServiceWrapper } from "../../../shared"
import { ServerRoomCard } from "../../../entities/room"
import { RoomsAPI } from "../../../features/rooms"
import { ErrorCatcherService } from "../../../shared"
import { ServiceWrapper } from "../../../shared/lib/services/Kek"


const authStore = AuthUserController.getInstance()

export const store = {
    layout: CommonLayoutStore && new CommonLayoutStore(),
    auth: authStore,
    room: WithCurrentUserServiceWrapper && new WithCurrentUserServiceWrapper<GameState>(authStore),
    player: ServiceWrapper && new ServiceWrapper<GamePlayer>(),
    roomsSearch: EntityController && new EntityController<ServerRoomCard>({
        api: new RoomsAPI(),
        key: 'rooms',
    }),
    errors: ErrorCatcherService.getInstance()
} as const


export const Context = createContext(store)
