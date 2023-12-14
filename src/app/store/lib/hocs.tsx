import { FC, ReactNode } from "react"
import { Context, store } from "../model"

export const Provider: FC<{ children: ReactNode }> = ({ children }) => {
    return <Context.Provider value={store}>
        { children }
    </Context.Provider>
}