// @ts-ignore
import { v4 as uuid } from 'uuid'
import { makeAutoObservable } from 'mobx'
import { AddNotificationPayload, Notification, NotificationType, NotificationVariant } from '../lib'


export class NotificationService {
    static instance: NotificationService | null = null
    static getInstance = () => {
        if (!this.instance) {
            this.instance = new NotificationService()
        }

        return this.instance
    }
    notifications: Notification[] = []
    private LS_KEY = 'fireforce/system/notifications'

    constructor() {
        makeAutoObservable(this)
    }

    saveNotifications = () => {
        localStorage.setItem(this.LS_KEY, JSON.stringify(this.notifications))
    }

    getLocalNotifications = () => {
        const items = localStorage.getItem(this.LS_KEY)
        this.notifications = items ? JSON.parse(items) : []
    }

    clearNotifications = () => {
        localStorage.removeItem(this.LS_KEY)
    }

    addNotification = ({ message, type, title, variant, expireTime }: AddNotificationPayload) => {
        const id = uuid()
        this.notifications.push({
            id,
            type,
            title: title || null,
            message,
            variant: type === NotificationType.system ? variant || NotificationVariant.success : null,
            visible: true,
            date: Date.now(),
            timer: setTimeout(() => {
                this.hideNotification(id)
            }, expireTime || 5000)
        })

    }

    deleteNotification = (id: string) => {
        this.notifications = this.notifications.filter(n => {
            if (n.id === id) {
                clearTimeout(n.timer)
            }
            return n.id !== id
        })
    }

    hideNotification = (id: string) => {
        const notification = this.notifications.find(n => n.id === id)

        if (notification) {
            notification.visible = false
            clearTimeout(notification.timer)
        }
    }
}
