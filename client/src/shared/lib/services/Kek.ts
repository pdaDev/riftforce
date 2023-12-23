import { makeObservable, observable, action } from "mobx"
import { AuthUserController } from "../../../features/auth"
import { User } from "../../../Classes/Class"


interface IService {
    stop(): void
}
export interface IServiceWithCurrentUser extends IService {
    currentUser: User | null
}


export class ServiceWrapper<T extends IService> {
    service: T | null = null

    setService = (service: T) => {
        this.service = service
    }

    clearService = () => {
        this.service?.stop()
        this.service = null
    }
}

export class WithCurrentUserServiceWrapper<T extends IServiceWithCurrentUser> {
    service: T | null = null
    authService: AuthUserController 

    constructor(authService: AuthUserController) {
        this.authService = authService
        makeObservable(this, {
            service: observable,
            setService: action,
            clearService: action
        })
    }

    setService = (cb:( (currentUser: User) =>  T)): Promise<T> => {
        return new Promise((res, rej) => {
            if (this.authService.user) {
                this.service = cb(this.authService.user)
                res(this.service as T)
            }

            rej()
        })
    }

    clearService = () => {
        this.service?.stop()
        this.service = null
    }
}