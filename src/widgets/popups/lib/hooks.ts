import { useEffect } from "react"
import { useStore } from "../../../app/store"

export const usePopup = (condition = true) => {
    useEffect(() => {
        const el = document.getElementById('root')!
        if (condition) {
            const paddingSize = window.innerWidth - document.body.clientWidth
            el.style.overflow = 'hidden'
            el.style.paddingRight = `${paddingSize}px`
            return () => {
                el.style.overflow = 'auto'
                el.style.paddingRight = `0px`
            }
        }
    }, [condition])
}

export const usePopupsStore = () => {
    return useStore().layout.popups
}