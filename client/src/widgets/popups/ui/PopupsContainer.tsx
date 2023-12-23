import { FC } from "react";
import { CreateRoomPopup as CreateRoomPopupComponent, PassRoomPasswordPopup as PassRoomPasswordPopupComponent,  } from "../../../features/rooms";
import { observer } from "mobx-react-lite";
import { withPopup } from "..";
import { DeclineChangesPopup } from "./DeclineChangesPopup";
import { StartLocalGamePopup } from "../../../features/game";

const CreateRoomPopup = withPopup('create-room')(CreateRoomPopupComponent)
const LocalPlayPopup = withPopup('local-play')(StartLocalGamePopup)
const PassRoomPasswordPopup = withPopup('password-pass')(PassRoomPasswordPopupComponent)

export const PopupsContainer: FC = observer( () => {
    return <>
        <CreateRoomPopup/>
        <PassRoomPasswordPopup/>
        <DeclineChangesPopup/>
        <LocalPlayPopup/>
    </>
})

