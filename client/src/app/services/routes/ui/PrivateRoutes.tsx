import { Navigate, Outlet, useLocation } from "react-router-dom"
import tree from '../model/routeTree'
import { FC } from "react"
import { observer } from "mobx-react-lite"
import { PermissionType } from "../../../../shared/lib/types"
import { useHasAccess } from "../../../../shared/lib/hooks"

interface IProps {
    permission?: PermissionType
}

const { paths } = tree

export const PrivateRoutes: FC<IProps> = observer(({ permission }) => {
    const hasAccess = useHasAccess(permission || PermissionType.every)
    const { pathname } = useLocation()

    const pathByPermission: Partial<Record<PermissionType, string>> = {
        [PermissionType.authorized]: paths.login.getKey(),
        [PermissionType.unauthorized]: paths.home.getKey(),
        [PermissionType.admin]: paths.login.getKey(),
    }

    const redirectPath = permission ? pathByPermission[permission] || '' : ''
    
    return hasAccess
        ? <Outlet/>
        : <Navigate to={redirectPath} state={{ path: pathname }}/>
    })