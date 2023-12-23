import { FC } from "react"
import { usePopupsStore } from "../../../widgets/popups"

export const CreateRoomButton: FC = () => {
    const { openModal } = usePopupsStore()
    const createRoomOpenPopup = () => {
        openModal({ key: "create-room", payload: null })
    }

    return (
        <button
            className="px-4 py-2 rounded-lg text-white bg-amber-500"
            onClick={createRoomOpenPopup}>
            Создать комнату
        </button>
    )
}
