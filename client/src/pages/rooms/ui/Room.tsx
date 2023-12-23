import { FC, useEffect } from "react"
import { useStore } from "../../../app/store"
import { useQueryRemoteParam } from "../../../shared"
import { GameState } from "../../../Classes/Class"
import { GameStateComponent } from "../../../Components/GameStateComponent"
import { useParams } from "react-router-dom"
import { observer } from "mobx-react-lite"
import { usePopupsStore } from "../../../widgets/popups"

export const Room: FC = observer(() => {
    const { setService, service, clearService } = useStore().room
    const { id } = useParams()
    const { type, isRemote } = useQueryRemoteParam()
    const { openModal } = usePopupsStore()

    useEffect(() => {
        if (id && !service) {
            if (isRemote) {
                setService((user) => new GameState(id, type, user)).then(
                    (service) =>
                        service.start(undefined, () =>
                            openModal({
                                key: "password-pass",
                                payload: {
                                    id,
                                    onPasswordSuccess: () => service.start(),
                                },
                            })
                        )
                )
            } else {
                setService((user) => new GameState(id, type, user)).then(
                    (service) => service.start()
                )
            }
        }

        return clearService
    }, [isRemote, type])

    if (service) {
        return <GameStateComponent state={service} />
    }

    return null
})
