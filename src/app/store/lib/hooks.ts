import { useContext } from "react"
import { Context } from "../model"

export const useStore = () => {
    const state = useContext(Context)

    return state
}