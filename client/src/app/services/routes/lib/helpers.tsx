import { ObjectTree, Tree, TreeNode, keyParam, pathParam } from "../namespace";
import { getObjectKeys } from "../../../../shared/lib/helpers/common";
import { PermissionType } from "../../../../shared/lib/types";
import { ReactNode } from "react";
import { Route } from "react-router-dom";
import { PrivateRoutes } from "..";

type RoutesByPermission = Partial<Record<PermissionType, { path: string, element: ReactNode }[]>>

export function formatTree<T extends Tree>(tree: T) {
    const routesByPermission: RoutesByPermission = {}
    const lazyRoutesByPermission: RoutesByPermission = {}
       
    function getRoutePath<T extends Tree>(tree: T, path: string = '', defaultPermission = PermissionType.every, level = 0, defaultLazy: boolean = false) {
        function concatPath(key: string | number) {
            return `${path}/${key}`
        }   
    
        return getObjectKeys(tree).reduce<ObjectTree<T>>((acc, key) => {
            const isKey = key === keyParam
            const isObject = typeof tree[key] === 'object' && tree[key] !== null
    
            let truePath = isObject
                ? getObjectKeys(tree[key] as TreeNode).includes(pathParam)
                    ? (tree[key] as TreeNode)[pathParam] as string
                    : String(key)
                : String(key)
    
            const isZeroLevel = level === 0
            const component = isZeroLevel
                ? isObject
                        ? (tree[key] as TreeNode).component
                        : tree[key] as ReactNode
                : isObject
                    ? (tree[key] as TreeNode).component 
                    : undefined

            const permission = isObject
                ? (tree[key] as TreeNode).permission || defaultPermission
                : defaultPermission

            const lazyStatus = isObject
                ? (tree[key] as TreeNode).lazy || defaultLazy
                : defaultLazy
          

    
            truePath = isKey ? `:${truePath}` : truePath
            
            const addComponent = (routes: RoutesByPermission, add: boolean = true) => {
                if (component && add) {
                    routes[permission] = routes[permission] || []
    
                    routes[permission]!.push({
                        path: concatPath(truePath),
                        element: component
                    })
                }
            }

            addComponent(routesByPermission, !lazyStatus)
            addComponent(lazyRoutesByPermission, lazyStatus)

            const params = (p: string | number) => isObject
                ? getRoutePath(tree[key] as TreeNode, concatPath(p), permission, level + 1, lazyStatus)
                : {}
    
            if (isKey) {
                    // @ts-ignore
                acc[key] = ((k?: string | number) => ({
                    getKey: () => concatPath(k || truePath),
                    ...params(k || truePath),
                })) as any
            } else {
                        // @ts-ignore
                acc[key as keyof TreeNode] = {
                    getKey: () => concatPath(truePath),
                    ...params(truePath),
                } as any
            }
            return acc
        }, {} as any)
    }

    


    return {
        paths: getRoutePath(tree),
        routes: {
            instant: routesByPermission,
            lazy: lazyRoutesByPermission,
        }
    }
}

export const getRoutesByPermission = (routes: RoutesByPermission) => {
    return getObjectKeys(routes).map(key => {
        return <Route element={  <PrivateRoutes permission={key} />}>
           { routes[key]!.map(route => <Route {...route} key={route.path} />) }
        </Route>
    })
}