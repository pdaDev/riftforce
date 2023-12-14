import {FC, useMemo} from "react";
import { Routes} from "react-router-dom";
import tree from "../model/routeTree";
import { getRoutesByPermission } from "../lib/helpers";

const { routes: { lazy, instant } } = tree
 
export const AppRoutes: FC = () => {
    const routesComponents = useMemo(() => {
        return getRoutesByPermission(instant)
    }, [])
    const lazyRoutesComponents = useMemo(() => {
        return getRoutesByPermission(lazy)
    }, [])

    return (
        <Routes>
           { ...routesComponents }
           { ...lazyRoutesComponents }
        </Routes>
    )
}