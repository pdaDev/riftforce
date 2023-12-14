import { InGameCode, ServerFinalState, ServerGameState, ServerRoomState, StageCode } from "./namespace"
import { DraftStage, RoomType } from "../shared"


export const BASE_GUILDS_CODE = [
    'ICE', 'LIGHT', 'FIRE', 'CRYSTAL', 'WATER',
    'AIR', 'DARK', 'FLORA', 'LIGHTNING', 'GROUND'
] as const

export const ADD_GUILDS = [
    'ACID', 'COMET', 'LOVE', 'MUSIC', 'BEAST',
    'MAGNETIC', 'LAVA', 'SAND'
] as const


export const LS_PLAYED_GAMES_KEY = 'RIFTFORCE_PLAYED_GAMES' as const
export const WEBSOCKET_SERVER_PATH = 'ws://localhost:3320'

export const EMPTY_SERVER_ROOM_STATE: ServerRoomState = {
    name: "",
    type: RoomType.public,
    password: null,
    saved: false,
    administrators: [],
    props: {
        playersCount: 2,
        withExtension: true,
        draftStages: [DraftStage.pick]
    },
    blackList: [],
    teams: [],
    creationDate: 0
}

export const EMPTY_SERVER_GAME_STATE: ServerGameState = {
    logs: [],

    periodStart: 0,
    currentDuration: 0,
    stage: InGameCode.draft,
    paused: false,
    guilds: [],
    teams: []
}

export const EMPTY_SERVER_FINAL_STATE: ServerFinalState = {
    owner: "",
    bigDaddy: "",
    stage: StageCode.room,
    roomState: EMPTY_SERVER_ROOM_STATE,
    game: EMPTY_SERVER_GAME_STATE,
    teams: []
}