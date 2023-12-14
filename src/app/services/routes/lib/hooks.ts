import {useNavigate} from "react-router-dom";
import tree from "../model/routeTree";
import { Callback } from "../namespace";

const { paths } = tree

export const useAppNavigate = (): (callback: Callback<typeof paths>, query?: object | string) => void => {
    const navigate = useNavigate()
    return (callback, query) => {
        let path = callback(paths).getKey()
        path = query ?
            typeof query === 'string'
                ? `${path}?${query}`
                : `${path}?${
                    Object.keys(query).map(key => `${key}=${query[key as keyof typeof query]}`).join('&')
                }` : path
        navigate(path)
    }
}

