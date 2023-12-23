import { useMemo } from "react"
import {
    FoolishBot,
    GameProcess,
    GameState,
    GuildFactory,
    InGameStageController,
    Team,
    Turn,
    User,
    UserDraft,
} from "./Classes/Class"
import { GameType } from "./Classes/namespace"
import { GameProcessComponent } from "./Components/GameProcessComponent"
import { AppRoutes, CommonLayoutWrapper } from "./app/services/routes"
import { BrowserRouter } from "react-router-dom"
// @ts-ignore
import { v4 as uuid } from "uuid"

function App() {
    // const gameProcess = useMemo(() => {
    //     const user1 = new User("1", "Player 1", "", null, 0)
    //     const user2 = new User("2", "Player 2", "", null, 0)
    //     const user3 = new User("3", "Player 3", "", null, 0)
    //     const user4 = new User("4", "Player 4", "", null, 0)
    //     const team1 = new Team(uuid(), [user1])
    //     const team2 = new Team(uuid(), [user2] as User[])

    //     const usersDrafts = new Map<User, UserDraft>()
    //     const draft1 = new UserDraft()
    //     const draft2 = new UserDraft()
    //     const draft3 = new UserDraft()
    //     const draft4 = new UserDraft()

    //     GuildFactory.getInstance()
    //         .createSeveral(["AIR", "AIR", "AIR"])
    //         .forEach((guild) => {
    //             draft1.choose(guild)
    //         })
    //     GuildFactory.getInstance()
    //         .createSeveral(["FIRE", "WATER", "DARK"])
    //         .forEach((guild) => {
    //             draft2.choose(guild)
    //         })
    //     GuildFactory.getInstance()
    //         .createSeveral(["AIR", "AIR", "AIR"])
    //         .forEach((guild) => {
    //             draft3.choose(guild)
    //         })
    //     GuildFactory.getInstance()
    //         .createSeveral(["FIRE", "WATER", "DARK"])
    //         .forEach((guild) => {
    //             draft4.choose(guild)
    //         })

    //     usersDrafts.set(user1, draft1)
    //     usersDrafts.set(user2, draft2)
    //     // usersDrafts.set(user3, draft3)
    //     // usersDrafts.set(user4, draft4)

    // const gameProcess = new GameProcess(
    //     new Turn([team1, team2], null, undefined, undefined, true),
    //     new InGameStageController(new GameState("", GameType.local), true),
    //     true
    // )
    //     gameProcess.start(usersDrafts)

    //     return gameProcess
    // }, [])

    return (
        <BrowserRouter>
            <CommonLayoutWrapper>
                <AppRoutes />
                {/* <GameProcessComponent process={gameProcess} /> */}
            </CommonLayoutWrapper>
        </BrowserRouter>
    )
}

export default App
