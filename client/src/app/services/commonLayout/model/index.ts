import { NotificationService } from "../../../../shared"
import { makeAutoObservable } from "mobx"
import { PopupsService } from "../../../../widgets/popups"


export class CommonLayoutStore {
    headerShowed: boolean = true
    footerShowed: boolean = true
    initialized: boolean = false
    popups: PopupsService = new PopupsService()
    notifications = NotificationService?.getInstance()

    constructor() {
        makeAutoObservable(this)
    }

    showHeader = () => {
        this.headerShowed = true
    }

    hideHeader = () => {
        this.headerShowed = false
    }

    showFooter = () => {
        this.footerShowed = true
    }
    
    hideFooter = () => {
        this.footerShowed = false
    }

    hideFooterAndHeader = () => {
        this.hideFooter()
        this.hideHeader()
    }

    showFooterAndHeader = () => {
        this.showFooter()
        this.showHeader()
    }

    initialize = () => {
        this.initialized = true
    }
}