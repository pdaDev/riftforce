import { User } from "../../Classes/Class"
import { ServerAuthUser, ServerUser } from "../../Classes/namespace"
import { ApiResponse } from "../../shared"

export type UserCredentials = { email: string, password: string }
export type ServerUserData = ServerUser & { isAdmin: boolean, activated: boolean }
export type RegisterPayload = UserCredentials & Pick<User, 'name'>
export type LoginPayload =UserCredentials
export type EditUserPayload = Partial<Omit<ServerUser, 'rating' | 'id' | 'email' | 'avatar'>> & {
    avatar: File | null | undefined
}

export type ServerAuthorizationResponse = {
    access: string
    user: ServerAuthUser
}


export interface AuthAPI {
    login(payload: LoginPayload): ApiResponse<ServerAuthorizationResponse>
    register(payload: RegisterPayload): ApiResponse<ServerAuthorizationResponse>
    logout(): ApiResponse<void>
    edit(payload: EditUserPayload): ApiResponse<ServerUserData>
    authme(): ApiResponse<ServerUserData>
}

export enum RequestKeys {
    login = 'login',
    register = 'register',
    edit = 'user-edit',
    authme = 'authme',
    logout = 'logout'
}