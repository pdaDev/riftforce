import { useLayoutStore } from "../../../app/services/commonLayout"

export const useNotifications = () => {
    return useLayoutStore().notifications
}