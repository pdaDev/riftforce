import { FC, useEffect } from "react";
import { useStore } from "../../../app/store";
import { PlayerComponent } from "../../../Components/PlayerComponent";
import { GamePlayer } from "../../../Classes/Class";
import { useParams } from "react-router-dom";
import { useQueryRemoteParam } from "../../../shared";

export const Player: FC = () => {
    const { service, setService, clearService } = useStore().player
    const { id } = useParams()
    const { type } = useQueryRemoteParam()

    useEffect(() => {
        if (id) {
            setService(new GamePlayer(id, type))
            service?.start()
        }
       
        return clearService
    }, [])

    if (service) {
        return <PlayerComponent state={service} />
    }

    return null
}