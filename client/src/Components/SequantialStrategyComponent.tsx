import { FC, MouseEventHandler, useEffect, useState } from "react"
import { ActionStrategy, SequentialStrategy, Turn } from "../Classes/Class"
import { observer } from "mobx-react-lite"
import { Backdrop } from "@mui/material"
import { Label } from "../shared"
import { GameStrategyCodeType } from "../Classes/namespace"

interface IProps {
    strategy: ActionStrategy | null
    turn: Turn
}

export const SequentialStrategyComponent: FC<IProps> = observer(
    ({ strategy, turn }) => {
        const [open, setOpen] = useState(true)

        useEffect(() => {
            if (strategy) {
                setOpen(true)
            }
        }, [strategy])

        const dontShowPopup =
            !strategy ||
            !(strategy instanceof SequentialStrategy) ||
            !strategy?.mounted

        if (dontShowPopup) {
            return null
        }

        const {
            highlightByGuild,
            resetHighlights,
            highlightByValue,
            chooseGuild,
            chooseValue,
            data,
            decline,
            stop,
            isStarted,
            canStartByGuild,
            canStartByValue,
            iterationStarted,
            activeValue,
            activeGuild,
            code,
        } = strategy

        const {
            value,
            guild: { name },
        } = data

        const handleChooseValue: MouseEventHandler = (e) => {
            setOpen(false)
            chooseValue()
            e.stopPropagation()
        }

        const handleChooseGuild: MouseEventHandler = (e) => {
            setOpen(false)
            chooseGuild()
            e.stopPropagation()
        }

        const showStopButton = !iterationStarted && isStarted && turn.isMyTurn
        const canStart = canStartByGuild || canStartByValue
        const popupIsOpen = open && turn.isMyTurn

        const strategyTitles: Partial<Record<GameStrategyCodeType, string>> = {
            [GameStrategyCodeType.activate]: "Активация по",
            [GameStrategyCodeType.spawn]: "Призыв по",
        }

        const strategyTitle = strategyTitles[code]
        const strategyStartType = activeGuild
            ? `гильдии ${activeGuild.name}`
            : `номеру ${activeValue}`
        const showStrategyTitle = strategyTitle && isStarted

        return (
            <>
                <Backdrop open={popupIsOpen} onClick={decline}>
                    <div className="bg-white rounded-lg p-4 w-fit" id="modal">
                        <div className="flex flex-col gap-3 justify-center">
                            {canStart ? (
                                <>
                                    <Label
                                        variant="h3"
                                        value={
                                            strategy.code === "SPAWN"
                                                ? "Призвать по"
                                                : "Активировать по"
                                        }
                                    />

                                    {canStartByValue && (
                                        <button
                                            onClick={handleChooseValue}
                                            onMouseOver={highlightByValue}
                                            onMouseLeave={resetHighlights}
                                            className="rounded">
                                            Числу&nbsp;
                                            <span className="px-2 py-1 text-white rounded-sm bg-amber-500">
                                                {value}
                                            </span>
                                        </button>
                                    )}
                                    {canStartByGuild && (
                                        <button
                                            onClick={handleChooseGuild}
                                            onMouseOver={highlightByGuild}
                                            onMouseLeave={resetHighlights}>
                                            Гильдии&nbsp;
                                            <span className="px-2 py-1 text-white rounded-sm bg-amber-500">
                                                {name}
                                            </span>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <Label
                                    variant="h3"
                                    value={"Нечего активировать"}
                                />
                            )}
                        </div>
                    </div>
                </Backdrop>
                {showStopButton && (
                    <button
                        className="rounded-md w-fit px-3 py-2 bg-amber-500"
                        onClick={stop}>
                        Стоп
                    </button>
                )}
                {showStrategyTitle && (
                    <Label
                        variant="h3"
                        value={`${strategyTitle} ${strategyStartType}`}
                    />
                )}
            </>
        )
    }
)
