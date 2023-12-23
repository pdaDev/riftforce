import { useStore } from "../../../store"

export const useLayoutStore = () => {
    return useStore().layout
}