import { FC, ReactNode, createContext, useContext } from "react";
import { GameProcess, GameState, GuildFactory, Team, Turn, User, UserDraft } from "../Classes/Class";

const user1 = new User('1', 'User1', null)
const user2 = new User('2', 'User2', null)

const team1 = new Team('TS', [user1])
const team2 = new Team('GG', [user2])

const usersDrafts = new Map<User, UserDraft>()
const draft1 = new UserDraft()
const draft2 = new UserDraft()

GuildFactory.getInstance().createSeveral(['ACID', 'AIR', 'BEAST', 'COMET']).forEach(guild => {
    draft1.choose(guild)
})
GuildFactory.getInstance().createSeveral(['FIRE', 'WATER', 'DARK', 'BEAST']).forEach(guild => {
    draft2.choose(guild)
})

usersDrafts.set(user1, draft1)
usersDrafts.set(user2, draft2)

const teams = [team1, team2]
const turn = new Turn(teams)

const gameState = new GameState(teams)
gameState.setGameStage(new GameProcess(turn, gameState, usersDrafts))

const store = {
    gameState: gameState
} as const


const Context = createContext({ gameState: new GameState() } )


export const Provider: FC<{ children: ReactNode }> = ({ children }) => {
    return <Context.Provider value={store}>
        { children }
    </Context.Provider>
}

export const useStore = () => {
    const state = useContext(Context)

    return state
}