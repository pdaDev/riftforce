import { FC } from "react";
import { useNotifications } from "..";
import { observer } from "mobx-react-lite";
import { SystemNotification } from "./SystemNotification";
import { InfoNotification } from "./InfoNotification";
import { NotificationType } from "../../../shared";

export const  NotificationsContainer: FC = observer(() => {
    const { notifications, hideNotification } = useNotifications()

    const handleNotificationClose = (id: string) => () => {
        hideNotification(id)
    }
    
    return <div className="absolute left-4 bottom-4 w-1/4 flex flex-col gap-3">
        { notifications.filter(({ visible }) => visible).map(({ type, id, variant, ...props }) => {
            switch (type) {
                case NotificationType.system:
                    return <SystemNotification key={id} {...props} variant={variant!} close={handleNotificationClose(id)} />
                case NotificationType.info:
                    return <InfoNotification key={id} {...props} close={handleNotificationClose(id)} />
                default:
                    return null
            }
        }) }
    </div>
})