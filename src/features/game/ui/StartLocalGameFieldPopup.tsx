import { FC, useRef } from "react";
import { IBasePopupProps } from "../../../shared";
import { FoolishBot, GameRoomPropsController, GameState, Team, User, UsersStorage } from "../../../Classes/Class";
import { GameType, ServerPropsWithoutName } from "../../../Classes/namespace";
import { useAppNavigate } from "../../../app/services/routes";
import { GameRoomPropsEditForm } from "../../rooms/ui/GamePropsEditForm";
import { useStore } from "../../../app/store";
// @ts-ignore
import { v4 as uuid } from 'uuid'
import { useAuth } from "../../auth";

export const StartLocalGamePopup: FC<IBasePopupProps> = ({ onClose }) => {
    const contentRef = useRef(new GameRoomPropsController(undefined, true))
    const { setService } = useStore().room
    const { user } = useAuth()
    
    const props = contentRef.current

    const n = useAppNavigate()
       
    const startGame = ({ playersCount, draftStages, withExtension }: ServerPropsWithoutName) => {
        if (user) {
            const team1Users: User[] = [user]

            if (playersCount === 4) {
                team1Users.push(new FoolishBot())
            }
            const team2Users: User[] = []
            const team2UsersCount = playersCount >= 3 ? 2 : 1

            for (let i = 0; i < team2UsersCount; i++) {
                team2Users.push(new FoolishBot())
            }

            const team1 = new Team(uuid(), team1Users)
            const team2 = new Team(uuid(), team2Users)

            const users = new UsersStorage([team1, team2])

            const sessionId = uuid()

            setService((user) => new GameState(sessionId, GameType.local , user))
                .then(service => {
                    onClose()
                    service.start({
                        users,
                        config: {
                            withExtension,
                            draftTemplates: draftStages,
                        }
                    })
                    n(p => p.rooms._key_(sessionId), { remote: 0 })
            })   
        }
    }
    
    return (
        <div className="w-[600px] w-full">
            <h2 className="text-xl font-semibold mb-2">
                Играть локально
            </h2>
            <GameRoomPropsEditForm onClose={onClose} 
                                   props={props}
                                   loading={false}
                                   hide={{
                                       type: true
                                   }}
                                   onSubmit={startGame}
                                   canSubmit={true}
                                   submitButtonLabel={'Запустить игру'}
            />
        </div>
    )
}