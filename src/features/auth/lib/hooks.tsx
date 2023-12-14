import { useEffect } from "react"
import { useStore } from "../../../app/store"

export const useAuth = () => {
    const { auth } = useStore()

    return auth
}

export const useAutoAuth = () => {
    const { authme } = useAuth()
    const { layout: { initialize } } = useStore()

    useEffect(() => {
        authme().then(initialize)
    }, [])
}