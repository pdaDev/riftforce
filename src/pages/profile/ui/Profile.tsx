import { FC } from "react";
import { UserEditForm, useAuth, RequestKeys } from "../../../features/auth";
import { useFormMode } from "../../../shared";
import { observer } from "mobx-react-lite";


export const Profile: FC = observer(() => {
    const { user, edit, loadings } = useAuth()
    const { isEdit, setViewMode, setEditMode } = useFormMode(undefined, true)
    
    if (!user) {
        return null
    }

    if (isEdit) {
        return <UserEditForm onClose={setViewMode}
                             user={user}
                             edit={edit}
                             loading={loadings[RequestKeys.edit]}
         />
    }

    const { name, email, avatar } = user

    return <>
    <div>
        <button onClick={setEditMode}>
            edit
        </button>
        <h2>
            { name }
        </h2>
        <h2>
            { email }
        </h2>
        <img src={avatar || ''} alt="" className="max-w-sm"/>
    </div>
    </>
})