import {
    ChangeEventHandler,
    ComponentProps,
    FC,
    FormEventHandler,
    useState,
} from "react"
import { GameRoomPropsController } from "../../../Classes/Class"
import {
    Switch,
    FormControlLabel,
    ToggleButtonGroup,
    ToggleButton,
} from "@mui/material"
import {
    useBlurFocus,
    DraftStage,
    AVAILABLE_PLAYERS_COUNT,
    InfoIcon,
    RoomType,
} from "../../../shared"
import { EditForm } from "../../../shared/ui/EditForm"
import { DraftStageAddButton } from "./DraftStageAddButton"
import { t } from "../lib"
import { ServerPropsWithoutName } from "../../../Classes/namespace"
import CloseIcon from "@mui/icons-material/Close"
import AddIcon from "@mui/icons-material/Add"
import { observer } from "mobx-react-lite"
import { PasswordInput } from "../../../shared/ui/PasswordInput"

interface IProps
    extends Pick<
        ComponentProps<typeof EditForm>,
        | "loading"
        | "submitButtonLabel"
        | "loadingStatusLabel"
        | "declineButtonLabel"
        | "notifyAboutChanges"
    > {
    props: GameRoomPropsController
    onClose: Function
    onSubmit: (data: ServerPropsWithoutName) => void
    canSubmit?: boolean
    hide?: {
        type?: boolean
    }
}

export const GameRoomPropsEditForm: FC<IProps> = observer(
    ({
        props,
        onClose,
        onSubmit,
        canSubmit = true,
        submitButtonLabel,
        declineButtonLabel,
        loadingStatusLabel,
        notifyAboutChanges,
        loading,
        hide,
    }) => {
        const {
            addStage,
            playersCount,
            withBan,
            draftStages,
            withExtension,
            initData,
            setPlayersCount,
            setWithExtension,
            deleteStage,
            password,
            setRoomType,
            type,
        } = props

        const [isSelectingDraftStage, setSelectingDraftStage] = useState(false)

        const startAddingDraftStage = () => setSelectingDraftStage(true)

        const stopAddingDraftStage = () => setSelectingDraftStage(false)

        const { onBlur, onFocus } = useBlurFocus(stopAddingDraftStage)

        const formSubmitHandler: FormEventHandler<HTMLFormElement> = (e) => {
            e.preventDefault()
            onSubmit({
                ...props,
                password: props.password.data as string,
            })
        }

        const hasChanges = notifyAboutChanges
            ? withExtension !== initData.withExtension ||
              playersCount !== initData.playersCount ||
              !draftStages.every(
                  (stage, i) => stage === initData.draftStages[i]
              )
            : undefined

        const handleSetPlayersCount = (count: any) => () =>
            setPlayersCount(count)

        const handleSetWithExtension: ChangeEventHandler<HTMLInputElement> = (
            e
        ) => {
            setWithExtension(e.target.checked)
        }

        const addDraftStage = (stage: DraftStage) => {
            addStage(stage)
            stopAddingDraftStage()
        }
        const handleDeleteStage = (index: number) => () => deleteStage(index)

        const withExtensionSwitcherDisabled = withBan || playersCount > 2

        const canNotSubmit =
            !canSubmit ||
            (props.type === RoomType.private &&
                (!props.password.data || !props.password.isValid))

        const onRoomTypeChange = (_: MouseEvent, newType: RoomType | null) => {
            if (newType) {
                setRoomType(newType)
            }
        }

        const isPrivateRoom = type === RoomType.private
        const canEditDraftStages = playersCount === 2

        return (
            <EditForm
                onClose={onClose}
                disabled={canNotSubmit}
                onSubmit={formSubmitHandler}
                loading={loading}
                hasChanges={hasChanges}
                notifyAboutChanges={notifyAboutChanges}
                loadingStatusLabel={loadingStatusLabel}
                submitButtonLabel={submitButtonLabel}
                declineButtonLabel={declineButtonLabel}>
                <h3 className="mt-3">Количество пользователей</h3>
                <div className="flex gap-4">
                    {AVAILABLE_PLAYERS_COUNT.map((count) => (
                        <button
                            type="button"
                            key={count}
                            className={`rounded-full w-8 h-8 text-white ${
                                count === playersCount
                                    ? "bg-fuchsia-100"
                                    : "bg-fuchsia-400"
                            }`}
                            onClick={handleSetPlayersCount(count)}>
                            {count}
                        </button>
                    ))}
                </div>
                <FormControlLabel
                    sx={{ width: "auto" }}
                    control={
                        <Switch
                            checked={withExtension}
                            disabled={withExtensionSwitcherDisabled}
                            onChange={handleSetWithExtension}
                        />
                    }
                    label="Использовать дополнение"
                />
                {withExtensionSwitcherDisabled && (
                    <InfoIcon message="Не хватает карт" />
                )}

                {canEditDraftStages && (
                    <>
                        <h2>Настройка стадий драфта</h2>
                        <div className="flex gap-2">
                            {draftStages.map((stage, i) => (
                                <div
                                    key={stage}
                                    className="px-4 py-1 rounded-md bg-fuchsia-300 text-white relative">
                                    {t(stage)}

                                    <button
                                        type="button"
                                        onClick={handleDeleteStage(i)}
                                        className="ml-2">
                                        <CloseIcon sx={{ width: 16 }} />
                                    </button>
                                </div>
                            ))}
                            <div
                                tabIndex={0}
                                onFocus={onFocus}
                                onBlur={onBlur}
                                className="relative">
                                <button
                                    type="button"
                                    onClick={startAddingDraftStage}
                                    className="px-2 py-1 rounded-md bg-fuchsia-300 text-white relative">
                                    <AddIcon sx={{ width: 16 }} />
                                </button>
                                {isSelectingDraftStage && (
                                    <div className="flex gap-1 absolute -bottom-20 -left-1 flex-col">
                                        <DraftStageAddButton
                                            addStage={addDraftStage}
                                            stage={DraftStage.pick}
                                            translateStage={t}
                                        />
                                        <DraftStageAddButton
                                            addStage={addDraftStage}
                                            stage={DraftStage.ban}
                                            translateStage={t}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                {!hide?.type && (
                    <>
                        <h2>Тип комнаты</h2>
                        <ToggleButtonGroup
                            value={type}
                            exclusive
                            onChange={onRoomTypeChange as any}>
                            <ToggleButton
                                type="button"
                                value={RoomType.public}
                                aria-label="left aligned">
                                Публичная
                            </ToggleButton>
                            <ToggleButton
                                type="button"
                                value={RoomType.private}
                                aria-label="left aligned">
                                Приватная
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {isPrivateRoom && (
                            <PasswordInput
                                value={password.data?.toString() || ""}
                                onChange={password.setValue}
                                error={password.error}
                            />
                        )}
                    </>
                )}
            </EditForm>
        )
    }
)
