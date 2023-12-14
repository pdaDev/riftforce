import { FC, MouseEventHandler } from "react";
import { HTTPAxiosAPI } from "..";

export enum FormMode {
    view = 'VIEW',
    edit = 'EDIT',
    create = 'CREATE'
}

export type TimeoutId = ReturnType<typeof setTimeout>

type Nulll<T> = T | null;
type Empty<T> = T | null | undefined;
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

export type Paths<T> = (T extends object ?
    { [K in Exclude<keyof T, symbol>]: T[K] extends Array<any>
        ? K
        : T[K] extends (Nulll<T> | Empty<T> | T)
            ? K
            : (`${K}${DotPrefix<Paths<T[K]>>}` | K)
    }[Exclude<keyof T, symbol>]
    : '') extends infer D ? Extract<D, string> : '';



export type Option = {
    label: string
    value: string | null
}
export type ElementSize = 'medium' | 'large' | 'small';

export type Percent = `${number}%`

export type ElementWidth = 'full' | 'auto' | number | Percent

export type ElementColor = 'primary' | 'secondary'

export type SpaceLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Color = 'light-card' | 'warning' | 'green-light' | 'primary' | 'secondary' | 'background' | 'grey-1' | 'grey-light' | 'fnt-primary' | 'red-light' | 'red' | 'fnt-black' | 'orange' | 'green' | 'primary-light'

export type FontWeight = 'bold' | 'medium' | 'regular' | 'semi-bold' | 'light'

export type Nullable<T extends object> = {
    [K in keyof T]:  T[K] | null
}

export type NullableAndUndefined<T extends object> = {
    [K in keyof T]:  T[K] | null | undefined
}

export type CardType = 'small' | 'large'

type RowPos = 'left' | 'right'

type ColumnPos = 'up' | 'down'

export type Pos = RowPos | ColumnPos

export type Position<T extends PosType> = {
    type: T
    defaultPos: PosAccordingPosType<T>
} | Pos


export type PosType = 'fixed' | 'auto-row' | 'auto-col' | 'auto'

type PosAccordingPosType<T extends PosType> = T extends ('fixed' | 'auto') ? Pos : T extends 'auto-row' ? RowPos : ColumnPos

export type CarPropType = 'title' | 'value'

export type ChatLoadedImage = {
    url: string
    object: File
}

export interface IRetrieveImage {
    id: number
    photo: string
}

export type LoadedImage = { photo: string, id: null | number, file: null | File }

export enum PermissionType {
    authorized = 'AUTHORIZED',
    admin = 'ADMIN',
    activated = 'ACTIVATED',
    every = 'EVERYBODY',
    unauthorized = 'UNAUTHORIZED'
}

export type CommonCardProps<T extends object> = {
    loading?: boolean
    onClick: MouseEventHandler<any>
    data: null | T
}

export enum DraftStage {
    ban = 'BAN',
    pick = 'PICK'
}

export type ServerListResponse<T> = {
    list: T[]
    count: number
}

export type SortKey = `${'DESC' | 'ASC'}:${string}`

export type CommonListPayload<T extends object = {}> = {
    offset: number
    limit: number
    sort: null | SortKey
    filters?: T
}

export interface IBasePopupProps  {
    onClose: () => void
    currentKey: string
}

export type ComponentProps<T extends FC> = Parameters<T>[0] 

export type LiteralTypes = string | number | null | symbol

export interface IOption {
    value: string | number
    label: string
}

export type ElemSize = 'small' | 'large' | 'medium'

export type ApiResponse<T> = Promise<T | null>

export type GetEntitiesListPayload<D extends object = {}> = CommonListPayload<D> & { key: string }

export interface EntitiesAPI<T extends object = object, D extends object = {}, R extends object = object> extends HTTPAxiosAPI {
    getList?(payload: GetEntitiesListPayload<D>): ApiResponse<ServerListResponse<T>>
    getEntity?(key: string, id: string): ApiResponse<R>
}

export enum ResponseResult {
    error = 'error',
    success = 'success',
}

export type CommonResultServerResponse = {
    result: ResponseResult
}

export type LabelVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export type FileSize = [number, 'KB' | 'MB' | 'B']

export enum RoomType {
    public = 'PUBLIC',
    private = 'PRIVATE'
}

export enum NotificationVariant {
    success = 'SUCCESS',
    error = 'ERROR',
    warning = 'WARNING',
}

export enum NotificationType {
    system = 'SYSTEM',
    info = 'INFO',
}

export enum StatusAction {
    total_error_disabled = 'TOTAL_ERROR_WITH_BLOCK',
    total_error = 'TOTAL_ERROR',
    notify_success = NotificationVariant.success,
    notify_error = NotificationVariant.error,
    notify_warning = NotificationVariant.warning,
} 

export type Notification = {
    id: string
    title: string | null
    message: string
    type: NotificationType
    variant: NotificationVariant | null
    date: number
    visible: boolean
    timer: any | 0
}

export type AddNotificationPayload = Pick<Notification, 'message' | 'type'> & Partial<Pick<Notification, 'title' | 'variant'>> & {
    expireTime?: number
}