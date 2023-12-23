import { FC, Fragment } from "react"
import { PointsManager, Turn } from "../Classes/Class"
import { UserComponent } from "./UserComponent"
import { observer } from "mobx-react-lite"

interface IProps {
    turn: Turn
    points: PointsManager
}

export const TurnWithPointsComponent: FC<IProps> = observer(
    ({ turn, points }) => {
        return (
            <div className="absolute left-0 top-0 flex flex-col gap-2 rounded-md shadow-md p-3">
                {turn.teams.map((team, i) => {
                    if (team.users.length > 1) {
                        return (
                            <Fragment key={team.id}>
                                <h3>
                                    Команда&nbsp;{team.name || `#${i + 1}`}{" "}
                                    {points.points.get(team)}
                                </h3>
                                {team.users.map((user) => (
                                    <UserComponent
                                        user={user}
                                        hasTurn={user === turn.currentTurn}
                                    />
                                ))}
                            </Fragment>
                        )
                    }
                    const user = team.users[0]
                    return (
                        <div
                            key={team.id}
                            className="flex gap-3 justify-between items-center">
                            <UserComponent
                                user={user}
                                hasTurn={user === turn.currentTurn}
                            />
                            {points.points.get(team)}
                        </div>
                    )
                })}
            </div>
        )
    }
)
