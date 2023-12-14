import { FC, useState } from "react"
import { GameRoom, Team } from "../Classes/Class"
import { TitleAutoInput } from "../shared/ui/LabelAutoInput"
import { Popovered, UserAvatar } from "../shared"
import { Button } from "@mui/material"
import { observer } from "mobx-react-lite"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UserType } from "../Classes/namespace"

interface IProps {
    gameRoom: GameRoom
}

export const TeamsComponent: FC<IProps> = observer(({ 
    gameRoom
 }) => {
    const { teams, connectToRandomTeam, connectToTeam, leaveTeam, props,
        myTeam, availableToConnectTeams, canAddUser, meReady, toggleReadyStatus,
        kickUser, changeAdmins, saved,
         isOwner, currentUser, owner, toggleRoomSave } = gameRoom
    const withNames = props.maxPlayersPerTeam > 1
    const [selectedTeam, selectTeam] = useState<{team: Team<any>, pos: number} | null>(null) 
    const isConnected = !!myTeam

    const toggleSelectTeam = (team: Team<any>, pos: number) => () => {
        if (availableToConnectTeams.includes(team)) {
            if (selectedTeam?.team === team && pos === selectedTeam.pos) {
                selectTeam(null)
            } else {
                selectTeam({ team, pos })
            }
        }
    }
    
    const showRandomButton = availableToConnectTeams.length > 1
    const canNotConnect =( availableToConnectTeams.length > 0 && !selectedTeam)
        || !canAddUser

    const onConnect = () => {
        if (canAddUser && selectedTeam) {
            connectToTeam(selectedTeam.team)
        }
    }

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex w-full justify-between">
                <div className="flex gap-4 w-full">
                    { teams.map((team) => {
                        const { name, id, users } = team
                        const isSelected = selectedTeam?.team === team
                        const hasFreePlaces = availableToConnectTeams.includes(team)
                        const countOfFreePlaces = hasFreePlaces ? props.maxPlayersPerTeam - users.length : 0 
                      
                        return <div key={id}
                                    className={'p-4 w-full rounded-lg bg-zinc-100'}
                        >
                            {  withNames && (
                                <TitleAutoInput
                                    value={name || ''}
                                    canEdit={id === myTeam?.id}
                                    onSubmit={() => {}}
                                />
                            )}
                            {
                                users.map(user => {
                                    const { name, avatar, ready, email, type, rating, id } = user
                                    const isAdmin = type === UserType.moderator
                                    const userTypeTitle = id === currentUser.id
                                    ? 'я'
                                    : id === owner.id 
                                        ? 'владелец'
                                        :  isAdmin
                                            ? 'модер'
                                            : undefined  

                                    const handleKickUser = () => kickUser(email, false)
                                    const handleBanUser = () => kickUser(email, true)
                                    const handleMakeAdmin = () => changeAdmins(email, false)
                                    const handleUndoMakeAdmin = () => changeAdmins(email, true)
                                    

                                    return <div className="flex gap-3 items-center w-full" key={id}>
                                     <div className="bg-white grow shadow-small items-center flex justify-between rounded-xl px-3 py-2" key={id}>
                                        <div className="flex gap-3 items-center">
                                            <UserAvatar src={avatar} />
                                            <h3 className="font-bold">
                                                { name }
                                            </h3>
                                            {
                                            userTypeTitle && (
                                            <h5 className="text-slate-300 font-light text-sm">
                                                { `(${userTypeTitle})` }
                                            </h5>
                                        )
                                       }
                                        </div>
                                      
                                        <div className="flex gap-3 items-center">
                                            <h4>
                                                { rating }
                                            </h4>
                                            <div className={`rounded-lg ${ready ? 'bg-green-500' : 'bg-red-500'} py-1 px-3 text-sm font-light ${ready ? 'text-green-700': 'text-red-700'}`}>
                                                { ready ? 'готов' : 'не готов' }
                                            </div>
                        
                                        </div>
                                    </div>
                                    { isOwner && currentUser.id !== id && (
                                           <Popovered renderEl={click => (
                                            <button className="w-[42px] h-[42px] shrink-0 rounded-full bg-slate-200 flex justify-center items-center"
                                                 onClick={click}
                                            >
                                                <MoreVertIcon className="text-slate-400"/>
                                            </button>
                                           )}>
                                                <div className="flex p-3 rounded-md shadow-md bg-white flex-col gap-2">
                                                    <Button onClick={handleKickUser}>
                                                        Кикнуть
                                                    </Button>
                                                    <Button onClick={handleBanUser}>
                                                        Забанить
                                                    </Button>
                                                    {
                                                        !isAdmin ? (
                                                            <Button onClick={handleMakeAdmin}>
                                                                Дать права админа
                                                            </Button>
                                                        ) : (
                                                            <Button onClick={handleUndoMakeAdmin}>
                                                                Забрать права
                                                            </Button>
                                                        )
                                                    }
                                                </div>
                                            </Popovered>
                                        )}
                                    </div>
                                })
                            }
                            {
                            !isConnected && [...new Array(countOfFreePlaces)].map((i) => (
                                    <div className={`items-center pointer  flex h-[56px] justify-center border-2 border-gray-300 rounded-xl px-3 py-2 ${isSelected && selectedTeam.pos === i && 'border-amber-600 text-orange-600'}`}
                                        key={i}
                                        onClick={toggleSelectTeam(team, i)}
                                            >
                                        <h4 className="text-gray-300">
                                            Свободное место
                                        </h4>
                                    </div>
                                ))
                            }
                        </div>
                    })}
                </div> 
        </div>
       <div className="flex justify-end gap-4 ">
       { isConnected ? (
                    <>
                    <Button onClick={toggleReadyStatus}>
                        { meReady ? 'Не готов' : 'Готов' }
                    </Button>
                     <Button className="w-fit" onClick={leaveTeam}
                    >
                        Покинуть команду
                    </Button>
                    </>
                   
                ) : (
                    <Button onClick={onConnect}
                            disabled={canNotConnect}
                    >
                        Присоединиться
                    </Button>
                )}
                { showRandomButton && !isConnected && (
                    <Button onClick={connectToRandomTeam}>
                        Наугад
                    </Button>
                )}
       </div>
       {
            <Button onClick={toggleRoomSave}>
                { saved ? 'Сохранено' : 'Сохранить' }
            </Button>
       }
    </div>
    )
}
)
