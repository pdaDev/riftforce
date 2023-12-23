import { makeAutoObservable } from 'mobx'
import { AuthUser } from '../../../Classes/Class'
import { AuthAPI, EditUserPayload, LoginPayload, RegisterPayload, ServerAuthorizationResponse } from '../namespace'
import { UserAuthAPI } from '../api'
import { HTTPAxiosAPI } from '../../../shared'
import { AuthUserMapper } from '../../../Classes/Mapper'
import { ServerAuthUser } from '../../../Classes/namespace'
import tokenService from '../../../shared/api/tokenService'

export class AuthUserController {
    static instance: AuthUserController | null = null
    api: AuthAPI & HTTPAxiosAPI
    user: AuthUser | null = null

    constructor(api?: AuthAPI & HTTPAxiosAPI) {
        this.api = api || new UserAuthAPI()
        makeAutoObservable(this)
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new AuthUserController(new UserAuthAPI())
        }

        return this.instance
    }

    get loadings () {
        return this.api.loadingStatuses
    }

    authme = async () => {
        this.processUser(await this.api.authme())
    }

    register = async (payload: RegisterPayload) => {
        this.processDataWithToken(await this.api.register(payload)  )  
    }

    edit = async (payload: EditUserPayload) => {
        const data = await this.api.edit(payload)
        
        if (data) {
            this.user = AuthUserMapper.toDomain(data)
        }
    }

    login =  async (payload: LoginPayload) => {
        this.processDataWithToken(await this.api.login(payload))
    }

    private processDataWithToken = (data: ServerAuthorizationResponse | null) => {
        if (data) {
            this.processUser(data.user)
            tokenService.saveToken(data.access)
        }
    }

    private processUser = (user: ServerAuthUser | null) => {
        if (user) {
            this.user = AuthUserMapper.toDomain(user)
        }
    }

    logout = async () => {
        tokenService.clearToken()
        this.user = null
        await this.api.logout()
    }

    get isAuthorized () {
        return !!this.user
    }

    get isAdmin () {
        return this.user && this.user.isAdmin
    }

    get isActivated () {
        return this.user && this.user.activated
    }
}
