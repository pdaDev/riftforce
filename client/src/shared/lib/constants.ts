export const BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://carbuyserver.onrender.com'
    : 'http://127.0.0.1:8000/'

export const closeSymbol = '×'
export const SPECIAL_SYMBOLS = '!@#$%^&*:?<>{}[];'
export const SAFE_METHODS = ['get', 'option']
export const ADVERTISEMENTS_CODE = ['O', 'B', 'F']
export const TINYINT_UNSIGNED = 255
export const INT_UNSIGNED = 4294967295.
export const SMALLINT_UNSIGNED = 65535
export const MEDIUMINT_UNSIGNED = 16777215
export const RUB_SYMBOL = '₽'
export const AVAILABLE_PLAYERS_COUNT = [2, 3, 4] as const 
export const REMOTE_KEY = 'remote'