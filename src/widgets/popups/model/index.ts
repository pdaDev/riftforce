import { makeAutoObservable } from 'mobx';
import * as NS from '../namespace';


export class PopupsService {
    opened: NS.CommonModal[] = []

    constructor() {
        makeAutoObservable(this)
    }

    openModal = (payload: NS.Modal) => {
        this.closeModal(payload.key)
        this.opened.push(payload)
    }

    closeModal = (key: NS.ModalsKeys) => {
        this.opened = this.opened.filter(modal => modal.key !== key)
    }

    get openedKeys() {
        return this.opened.map(modal => modal.key)
    }
}


