import { ServerRoomPropsPayload } from "../features/rooms"
import { DraftStage, RoomType } from "../shared"
import {
    ActionStrategy,
    CardsController,
    ChatMessage,
    Elemental,
    Field,
    InGameStage,
    Logger,
    MobData,
    SelectiveElement,
    Stage,
    Team,
    Timer,
    Turn,
    User,
    UsersStorage,
} from "./Class"
import { BASE_GUILDS_CODE, ADD_GUILDS } from "./constants"

export type ServerDeckData = MobDataCode[]

export type ServerUserDecks = {
    hand: ServerDeckData
    left: ServerDeckData
    deck: ServerDeckData
}

const USER_IDENTIFIER_KEY = "id" as const

export type ServerUser = {
    [USER_IDENTIFIER_KEY]: string
    name: string
    email: string
    avatar: string | null
    rating: number
}

export type ServerRoomUserState = ServerUser & {
    ready: boolean
}

export type ServerAuthUser = ServerUser & {
    isAdmin: boolean
    activated: boolean
}

export type ServerGuildsPool = GuildCode[]

type ServerUserIdentifier = Pick<ServerUser, typeof USER_IDENTIFIER_KEY>

export type ServerUserCards = ServerUserIdentifier & { cards: ServerUserDecks }

export type ServerFieldsData = ElementalCode[][]

export type ServerUserPicks = {
    bans: ServerGuildsPool
    picks: ServerGuildsPool
}

export type UsersCards = Map<User, CardsController>

export type DraftConfig = Partial<{
    withExtension: boolean
    draftTemplates: DraftStage[]
    guildsPerPlayer: number
}>

export type DefaultPicks = {
    total: ServerGameState["guilds"]
    users: Map<User, ServerUserPicks>
}

export type MobDataCode = `${GuildCode}_${number}_${number}`

export type ElementalCode = `${MobDataCode}_${number}`

export type MapNodeWithUserCode = `${string}_${number}`

export type MapNodeCode = MapNodeWithUserCode | string

export type FullFieldCode = `${MapNodeWithUserCode}_${ElementalCode}`

const TEAM_IDENTIFIER_KEY = "id" as const

export type ServerUserFields = {
    id: string
    fields: ServerFieldsData
}

export type ServerUserDrafts = ServerUserIdentifier & { draft: ServerUserPicks }

export type ServerGameUserState = ServerUserDrafts &
    ServerUserFields &
    ServerUserCards &
    ServerUser

export type ServerTeam<T = ServerUser> = {
    [TEAM_IDENTIFIER_KEY]: string
    name: string
    users: T[]
}

type ServerTeamIdentified = Pick<ServerTeam, typeof TEAM_IDENTIFIER_KEY>

export type ServerTeamPoints = ServerTeamIdentified & { points: number }

export type ServerRoomTeamState<T = ServerRoomUserState> = ServerTeam<T>

export type ServerGameTeamState<T = ServerGameUserState> = ServerTeam<T> &
    ServerTeamPoints

export type ServerFullUser = ServerUser & ServerGameUserState

export type ServerGameState = {
    logs: Log[]
    periodStart: number
    currentDuration: number
    stage: InGameCode
    paused: boolean
    guilds: GuildCode[]
    turnIndex: number
    teams: ServerGameTeamState[]
}

export const OWNER_SYSTEM = "system"

export type ServerRoomProps = Omit<
    ServerRoomPropsPayload,
    "password" | "type" | "name"
>

export type ServerRoomState = {
    name: string
    type: RoomType
    password: string | null
    saved: boolean
    props: ServerRoomProps
    teams: ServerRoomTeamState[]
    creationDate: number
    blackList: string[]
    administrators: string[]
}

export type ServerFullUserState = ServerGameUserState & ServerRoomUserState

export type ServerFullTeamState = ServerGameTeamState<ServerFullUserState> &
    ServerRoomTeamState<ServerFullUserState>

export type ServerFinalState = {
    owner: string // s
    bigDaddy: string // s
    stage: StageCode // c
    roomState: Omit<ServerRoomState, "teams"> // c
    game: Omit<ServerGameState, "teams"> // c
    teams: ServerFullTeamState[] // c
}

export type RedisState = {
    time: {
        paused: boolean
        periodStart: number
        currentDuration: number
    }
    gameState: {
        logs: Log[]
        guilds: GuildCode[]
        teams: ServerFullTeamState[]
        turnIndex: number
    }
    roomState: ServerRoomState
    stage: StageCode | InGameCode
    gameSessionId: string
    generalState: {
        owner: string // s
        bigDaddy: string //
    }
}

export type DefaultProcessGameState = {
    points: Map<Team, number>
    fields: Map<User, ElementalCode[][]>
    cards: Map<User, ServerUserDecks>
}

export enum LogInstigatorType {
    field = "FIELD",
    user = "USER",
    system = "SYSTEM",
}

export type LogInstigator = {
    type: LogInstigatorType
    target: string | null
}

export type Log = {
    id: string
    type: "util" | "extra" | "util&extra"
    action: string
    instigator: LogInstigator
    target: string | FullFieldCode | null
    date: string
    timestamp?: {
        seconds: number
        UTC: string
    }
    nested: Log[]
}

export type BranchyLog = Log & {
    branches: Log[]
}

export type LogPayload = Partial<Omit<Log, "action" | "date" | "timestamp">> &
    Pick<Log, "action">

export type LogAction = (log: LogPayload) => void

export type LogSideEffect = (log: Log) => void

export type PrevState = {
    users: UsersStorage
    config: DraftConfig
}

export type GuildCode =
    | (typeof BASE_GUILDS_CODE)[number]
    | (typeof ADD_GUILDS)[number]

export type UserTuple = [User, Team]

export type NodeNeighbors = "up" | "down" | "next" | "prev"

export type Command<T = unknown> = {
    target: T
    message: string
}

export type CommandFormatter = (data: Command<any>) => any

export type HighlightElementConfig = {
    highlightable?: boolean
    clickable?: boolean
    available?: boolean
}

export type HighlightElementConfigForGetActions = Omit<
    HighlightElementConfig,
    "available"
>

export type CardWithoutResultHandler = (card: MobData | null) => void

export type FieldHandler = (field: Field) => void

export type FieldHandlerWithNoResult = (field: Field | null) => void

export type EqualFunction = (el: Elemental, data: MobData) => boolean

export type GameProcessUpdateAllStatePayload = {
    teams: (Omit<ServerGameTeamState, "users"> & {
        users: (ServerUserFields & ServerUserCards)[]
    })[]
}

export type DraftUpdateAllStatePayload = Pick<ServerGameState, "guilds"> & {
    teams: {
        users: ServerUserDrafts[]
    }[]
}

export type NextTurnSideEffect = (user: User) => void

export enum GameStrategyCodeType {
    draw = "DRAW",
    activate = "ACTIVATE",
    spawn = "SPAWN",
}

export interface StrategyController {
    setStrategy(strategy: ActionStrategy | null): void
    stop(needRepeat?: boolean): void
    setLogAction(action: LogAction): void
}

export type ServerPropsWithoutName = Omit<ServerRoomPropsPayload, "name">

export type TimerChangeTimeSideEffect = (sec: number) => void

export type ChangeReadyStatusPayload = {
    user: string
    status: boolean
}

export type ConnectToRoomPayload = {
    user: ServerUser
}

export interface RoomAPI {
    editProps(payload: ServerRoomPropsPayload): Promise<void>
    changeReadyStatus(payload: boolean): void
    connectToRoom(): void
}

export type GameStatePayload = Pick<
    ServerGameState,
    "guilds" | "teams" | "turnIndex"
>

export interface SyncronizedRoomAPI {
    onUserConnect(cb: (payload: ConnectToRoomPayload) => void): void
    onChangeReadyStatus(cb: (payload: ChangeReadyStatusPayload) => void): void
    onEditProps(cb: (payload: ServerRoomPropsPayload) => void): void
}

export interface RoomsAPI {
    getRooms(): void
    connectToRoomByPassword(password: string): void
}

export interface ILoggingGameAPI {
    sendLog(log: Log): void
    getLog(cb: (log: Log) => void): void
}

type PausePayload = {
    initiatorId: string
} & RedisState["time"]

export type PlayedGame = {
    winner: string
    teams: ServerTeam<string>[]
    id: string
    startState: {
        draftConfig: DraftConfig
        guilds: string[]
        users: ServerGameUserState[]
        logs: Log[]
    }
    duration: number
    date: number
    type: RoomType
    access: string | null
}

export const WEBSOCKET_EVENTS = {
    connect: "connect",
    disconnect: "disconnect",
    error: "connect-error",
    kick: "kick",
    changeAdmins: "admins-change",
    joinTeam: "join-team",
    leaveTeam: "leave-team",
    joinRoom: "join-room",
    changeReadyStatus: "change-ready",
    editRoomProps: "edit-room-props",
    logAction: "log-action",
    startStage: "start-stage",
    togglePause: "pause",
    sendMessage: "send-message",
} as const

export type ServerGameEndData = { team: ServerFullTeamState; points: number }

export interface ISyncGameAPI {
    getGameState?(): Promise<Pick<ServerGameState, "logs" | "teams" | "guilds">>
    onGameStateChange(
        cb: (data: Pick<ServerGameState, "logs" | "teams" | "guilds">) => void
    ): void
    setGameState(state: GameStatePayload): Promise<void>
    pause(payload: PausePayload): Promise<void>
    onPause(cb: (data: PausePayload) => void): void
    startStage(stage: InGameCode, data: GameStatePayload): Promise<void>
    onStartStage(
        cb: (
            stage: StageCode | InGameCode,
            data: ServerFinalState | ServerGameEndData
        ) => void
    ): void
}

export interface ISyncRoomAPI {
    joinTeam(teamId: string): Promise<void>
    onJoinTeam(cb: (user: ServerUser, teamId: string) => void): void
    leaveTeam(): Promise<void>
    onLeaveTeam(cb: (userId: string) => void): void
    setReadyStatus(status: boolean): Promise<void>
    onChangeReadyStatus(cb: (userId: string, status: boolean) => void): void
    editProps(state: Partial<ServerRoomPropsPayload>): Promise<void>
    onEditProps(cb: (data: Partial<ServerRoomPropsPayload>) => void): void
    kickUser(userId: string, withBan: boolean): Promise<void>
    undoBanUser(userId: string): Promise<void>
    onKickUser(cb: (userId: string) => void): void
    saveRoom(): Promise<void>
    undoSaveRoom(): Promise<void>
    changeAdmin(email: string, reverse: boolean): Promise<void>
    onChangeAdmins(cb: (email: string, reverse: boolean) => void): void
}

type C = ILoggingGameAPI & ISyncRoomAPI & ISyncGameAPI

export interface IGameAPI extends C {
    getState(): Promise<ServerFinalState>
    connect(userId: string, cb: () => void): Promise<void>
    disconnect(cb: () => void): Promise<void>
    startStage(stage: InGameCode, data: GameStatePayload): Promise<void>
    sendMessage(message: ChatMessage): Promise<void>
    onSendMessage(cb: (message: ChatMessage) => void): void
}

export type InGameStageControllerDefaultData = ServerGameState & {
    currentUser: User | null
}

export enum InGameCode {
    draft = "DRAFT",
    process = "GAME_PROCESS",
}

export enum StageCode {
    room = "ROOM",
    game = "GAME",
    end = "END",
}

export interface LogReader {
    readLog(log: Log): void
    code: InGameCode
}

export interface IMessage {
    message: string
}

export interface ChatController {
    deleteMessage(m: IMessage): void
    deleteMessageLocally(me: IMessage): void
    editMessage(m: IMessage): void
    repeatMessageRequest(m: IMessage): void
}

export interface ChatAPI {
    sendChatMessage(m: IMessage): Promise<void>
    editChatMessage(m: IMessage): Promise<void>
    deleteChatMessage(m: IMessage): Promise<void>
    getLastMessage(): Promise<IMessage>
    getMessages(): Promise<IMessage[]>
}

export enum InteractionType {
    guild = "GUILD",
    value = "VALUE",
}

export interface Mediator<T = SelectiveElement> {
    notify(target: T, message: string, extra?: unknown): void
}

export enum UserType {
    user = "PLAYER",
    bot = "BOT",
    owner = "OWNER",
    moderator = "MODERATOR",
}

export interface IStageController {
    start(): void
    stop(): void
    getStage(): Stage
    setStage(stage: Stage): void
}

export interface GameStageController {
    setGameStage(stage: Stage, preloading?: boolean): void
    syncState(): void
    stopLoading(): void
    startLoading(): void
}

export interface IInGameStageController extends IStageController {
    setTimer(timer: Timer): void
    setStage(stage: InGameStage): void
    getStage(): InGameStage
    pause(): void
    unpause(): void
    code: StageCode | InGameCode
    start(prev?: PrevState): void
    setLogger(logger: Logger): void
    enableBots(status: boolean): void
    getPauseStatus(): boolean
    getTimer(): Timer
    getLogger(): Logger
    getTurnController(): Turn
    processUserTurn(user: User): void
    getEntityState(): GameStatePayload
    setDefaultData(data: any): void
}

export enum GameType {
    local = "LOCAL",
    remote = "REMOTE",
}

export type WebsocketEvents =
    (typeof WEBSOCKET_EVENTS)[keyof typeof WEBSOCKET_EVENTS]
