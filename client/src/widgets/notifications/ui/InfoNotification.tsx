import { FC, useEffect, useRef, useState } from "react";
import { NotificationWrapper } from "./NotificationWrapper";

interface IProps {
    title: string | null
    message: string | null
    close: () => void
    time?: number
}

export const InfoNotification: FC<IProps> = ({ close, message, title, time  }) => {
    const [timer, setTime] = useState(time || 0)
    const timerInterval = useRef<any>(null)

    useEffect(() => {
        if (time && time > 0 && timer > 0) {
            timerInterval.current = setInterval(() => {
                setTime(t => {
                    if (t === 0) {
                        close()
                    }
                    return t - 1
                })
            }, 1000)
            return () => clearInterval(timerInterval.current)
        }
    }, [time, timerInterval])

    if (time && timer === 0) {
        clearInterval(timerInterval.current)
    }

    return <NotificationWrapper close={close}>
        <div className="flex flex-col">
        { title && <h2 className="text-md font-semibold">
                { title }
            </h2> }
            { message && <p className="p-0 m-0 text-sm font-light">
                { message }
            </p> }
        </div>
            {
                time && (
                    <div className="absolute w-full left-0 bottom-0">
                        <div className={`h-1 bg-sky-600`}
                            style={{
                                width: `${(timer / time) * 100}%` ,
                                transition: '1s',
                                transitionTimingFunction: 'linear'
                            }
                        }
                        />
                     </div>
                )
            }
    </NotificationWrapper>
}