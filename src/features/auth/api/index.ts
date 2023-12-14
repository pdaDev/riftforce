import { HTTPAxiosAPI } from "../../../shared/api"
import { AxiosInstance } from "axios"
import { AuthAPI, EditUserPayload, LoginPayload, RegisterPayload, RequestKeys, ServerAuthorizationResponse, ServerUserData } from "../namespace"

export class UserAuthAPI extends HTTPAxiosAPI implements AuthAPI {
    constructor(baseUrl?: string, axios?: AxiosInstance) {
        super(baseUrl || 'auth/', axios,)
    }

    login = async (payload: LoginPayload) => {
        return await this.post<ServerAuthorizationResponse>('login', payload, {
            errorMessage: 'login error',
            key: RequestKeys.login,
            statuses: {
                400: {
                    title: 'Ошибка при авторизации'
                }
            }
        })
    }

    register = async (payload: RegisterPayload) => {
            return await this.post<ServerAuthorizationResponse>('register', payload, {
                errorMessage: 'register error',
                key: RequestKeys.register,
                statuses: {
                    400: {
                        title: 'Ошибка при авторизации'
                    }
                }
            })
    }

    logout = async () => {
            return await this.get('logout', {
                errorMessage: 'log out error',
                key: RequestKeys.logout,
                statuses: {
                    400: {
                        title: 'Ошибка при выходе'
                    }
                }
            })
    }

    edit = async ({ name, avatar }: EditUserPayload) => {
        const formatData = new FormData()
        name && formatData.append('name', name)
        avatar !== undefined && formatData.append('avatar', avatar || '')

        return await this.patch<ServerUserData>('me', formatData, {
            errorMessage: 'edit user error',
            key: RequestKeys.edit,
            headers:{ "Content-Type": "multipart/form-data" }
        })
    }

    authme = async () => {
            return await this.get<ServerUserData>('me', {
                errorMessage: 'auth user error',
                key: RequestKeys.authme,
                status: {
                    400: {
                        title: 'Ошибка при выходе'
                    }
                }
            })
    }
}

