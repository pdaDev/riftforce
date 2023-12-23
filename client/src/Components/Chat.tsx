import { ChangeEventHandler, FC, useState } from "react"
import { ChatMessage } from "../Classes/Class"
import { observer } from "mobx-react-lite"

interface IProps {
    messages: ChatMessage[]
    sendMessage: (message: string) => void
}

export const Chat: FC<IProps> = observer(({ messages, sendMessage }) => {
    const [message, setMessage] = useState("")
    // const [open, toggleOpen] = useState(true)

    const onMessageChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        setMessage(e.target.value)
    }

    const handleSendMessage = () => {
        sendMessage(message)
        setMessage("")
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                {messages.map((message) => (
                    <div>{message.message}</div>
                ))}
            </div>
            <div className="flex z-10 gap-2">
                <input
                    onChange={onMessageChange}
                    value={message}
                    className="border-1"
                />
                <button onClick={handleSendMessage}>Отправить</button>
            </div>
        </div>
    )
})
