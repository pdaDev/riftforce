import { makeAutoObservable } from 'mobx'

type TotalError = {
    message: string
    code: number
    disabled: boolean
}

export class ErrorCatcherService {
    static instance: ErrorCatcherService | null = null

    static getInstance = () => {
        if (!this.instance) {
            this.instance = new ErrorCatcherService()
        }

        return this.instance
    }

    constructor() {
        makeAutoObservable(this)
    }

    totalError: TotalError | null = null

    setTotalError = (code: number, message: string, disabled: boolean = false) => {
        this.totalError = { code, message, disabled }
    }
}

