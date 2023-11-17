import { FC } from "react"
import { ActionStrategy, SequentialStrategy } from "../Classes/Class"

interface IProps {
    strategy: ActionStrategy | null
}

export const SequentialStrategyComponent: FC<IProps> = ({ strategy }) => {
    if (!strategy || !(strategy instanceof SequentialStrategy)) {
        return null
    }

    const { highlightByGuild, resetHighlights, highlightByValue,
            chooseGuild, chooseValue, data } = strategy
    const { value, guild: { name } } = data

    return (
        <div className="fixed flex justify-center">
            <h3>
                { strategy.code === 'SPAWN' ? 'Призвать по' : 'Активировать по' }
            </h3>
        <button onClick={chooseValue}
                onMouseOver={highlightByValue}
                onMouseLeave={resetHighlights}
                className="bg-blue-500 rounded text-slate-100"
        >
            Числу&nbsp;{value}
        </button>
        <button onClick={chooseGuild}
                onMouseOver={highlightByGuild}
                onMouseLeave={resetHighlights}
        >
            Гильдии&nbsp;{name}
        </button>
        </div>
    )
}