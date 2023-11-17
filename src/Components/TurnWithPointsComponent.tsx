import { FC } from "react";
import { PointsManager, Turn } from "../Classes/Class";

interface IProps {
    turn: Turn
    points: PointsManager
}

export const TurnWithPointsComponent: FC<IProps> = ({ turn, points }) => {
    return (
        <>
            {
                turn.teams.map((team, i) => {
                    if (team.users.length > 1) {
                        return <>
                            <h3>
                                Команда&nbsp;{ team.name || `#${i + 1}` } { points.points.get(team) }
                            </h3>
                            {
                                team.users.map(user => {
                                    <div>
                                        { user.name } { turn.currentTurn === user ? 'your turn' : null } 
                                    </div>
                                })
                            }
                        </>
                    }
                    const user = team.users[0]
                    return  <div>
                                { user.name } { turn.currentTurn === user ? 'your turn' : null } { points.points.get(team) }
                            </div>
                })
            }
        </>
    )
}