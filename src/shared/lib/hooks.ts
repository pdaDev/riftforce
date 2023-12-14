import { useEffect, useState, useRef, FocusEventHandler, DragEventHandler } from "react"
import { useAppNavigate } from "../../app/services/routes"
import { FormMode, PermissionType, TimeoutId } from "./types"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "../../features/auth"
import { useLayoutStore } from "../../app/services/commonLayout"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup";
import { ObjectSchema } from "yup"
import { REMOTE_KEY, getObjectKeys } from "."
import { GameType } from "../../Classes/namespace"

export const useTabTile = (title: string, loading: boolean = false) => {
    useEffect(() => {
        if (loading)
            document.title = '...loading...'
        else document.title = title
    }, [title, loading])
}

export const useForceUpdate = (): () => void => {
    const [d, setD] = useState<boolean>(false)
    return () => setD(!d)
}

export const useToggle = (defValue: boolean = false): [state: boolean, toggle: () => void, setState: (value: boolean) => void] => {
    const [state, setState] = useState(defValue)
    const toggle = () => setState(state => !state)
    return [state, toggle, setState]
}

export const useHasAccess = (permission: PermissionType | PermissionType[]) => {
    const { isAuthorized, isAdmin, isActivated } = useAuth()

    const getPermissionByName = (p: PermissionType) => {
        switch (p) {
            case PermissionType.activated:
                return isActivated
            case PermissionType.authorized:
                return isAuthorized
            case PermissionType.admin:
                return isAdmin
            case PermissionType.unauthorized:
                return !isAuthorized
            default:
                return true
        }
    }

    if (Array.isArray(permission)) {
        return permission.every(getPermissionByName)
    }
    
    return getPermissionByName(permission)
}

export const useNavigationPermission = (defaultPermissions?: PermissionType[], permission?: boolean) => {
    const { initialized } = useLayoutStore()
    const defaultPermission = defaultPermissions ? useHasAccess(defaultPermissions) : true
    const ownPermission = permission ?? true
    const hasPermission = defaultPermission && ownPermission
    const n = useAppNavigate()

    if (!hasPermission && initialized) {
        n(p => p.home)
    }
}

export function useAutoRef<T extends HTMLDivElement | HTMLInputElement>() {
    const ref = useRef<T>(null)
    const forceUpdate = useForceUpdate()
    useEffect(() => {
        forceUpdate()
    }, [ref.current])

    return ref
}

export const useBlurFocus = (hide: Function): { onFocus: FocusEventHandler, onBlur: FocusEventHandler } => {
    const timer = useRef<any>()

    const onFocus = () => {
        clearTimeout(timer.current)
    }

    const onBlur = () => {
        timer.current = setTimeout(() => hide())
    }

    return {onFocus, onBlur}
}

export const useOpenStatus = (defaultValue = false)
    : [state: boolean, setState: (value: boolean) => void, toggle: Function] => {
    const [state, setState] = useState(defaultValue)
    const toggle = () => setState(!state)
    return [state, setState, toggle]
}

export function useClassState<T extends object>(defValue: T): [state: T, setState: (value: Partial<T>) => void] {
    const [state, setState] = useState(defValue)
    const setClassState = (value: Partial<T>) => setState({...state, ...value})

    return [state, setClassState]
}

export const useFileDrop = () => {
    const [dragStatus, setDragStatus] = useState<boolean>(false)
    const [dragUnderBLock, setDragUnderBlockStatus] = useState(false)
    const timer = useRef<TimeoutId | undefined>(undefined)
    const onDragOver: DragEventHandler = _ => {
        setDragUnderBlockStatus(true)
    }
    const onDragLeave: DragEventHandler = _ => {
        setDragUnderBlockStatus(false)
    }

    const onDrop = (onImageChanges: (files: FileList) => void) => ((e) => {
        e.preventDefault()
        const files = e.dataTransfer?.files
        if (files) {
            onImageChanges(files)
        }
    }) as DragEventHandler

    useEffect(() => {
        const onDragLeave = (e: DragEvent) => {
            timer.current = setTimeout(() => setDragStatus(false), 10)
            e.preventDefault()

        }
        const onDragOver = (e: DragEvent) => {
            e.preventDefault()
            clearTimeout(timer.current)
            setDragStatus(true)
        }

        const onDrop = (e: DragEvent) => {
            e.preventDefault()
            setDragStatus(false)
        }
        document.addEventListener('dragover', onDragOver)
        document.addEventListener('dragleave', onDragLeave)
        document.addEventListener('drop', onDrop)

        return () => {
            document.removeEventListener('dragover', onDragOver)
            document.removeEventListener('dragleave', onDragLeave)
            document.removeEventListener('drop', onDrop)
        }
    }, [timer])

    return {dragStatus, dragUnderBLock, onDragLeave, onDragOver, onDrop}
}

export const useFormMode = (defaultMode?: FormMode, query: boolean = false) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [stateFormMode, setStateFormMode] = useState(defaultMode || FormMode.view)

    const formMode: FormMode = query ? (searchParams.get('mode') as FormMode) || FormMode.view : stateFormMode
    
    const setFormMode = (mode: FormMode) =>
        query
            ? setSearchParams(mode === FormMode.view ? {} : { mode })
            : setStateFormMode(mode)

    return {
        setCreateMode: () => setFormMode(FormMode.create),
        setViewMode: () => setFormMode(FormMode.view),
        setEditMode: () => setFormMode(FormMode.edit),
        setFormMode,
        isEdit: formMode === FormMode.edit,
        isView: formMode === FormMode.view,
        isCreate: formMode === FormMode.create,
        formMode
    }
}

type Props<T extends object> = Parameters<typeof useForm>[0] & {
    schema: ObjectSchema<T>
}

export const useQueryRemoteParam = () => {
    const [query, setQuery] = useSearchParams()
    const remoteQueryParam = Number(query.get(REMOTE_KEY))
    const remote = (remoteQueryParam ?? 1) > 0
    
    const setRemoteParam = (status: boolean) => {
        const payload = status ? { [REMOTE_KEY]: '1' } : {}
        setQuery(payload as any)
    }

    return {
        isRemote: remote,
        setRemoteParam,
        type: remote ? GameType.remote : GameType.local,
    }
}

export function useFormController<T extends object>({ schema, defaultValues, resolver, ...props }: Props<T>) {
    const state = useForm<T>({
        ...props,
        // @ts-ignore
        resolver: resolver || (schema ? yupResolver(schema) : undefined)
    })

    const { setValue, watch } = state

    const ref = useRef(false)
    const initialized = ref.current

    const checkChanges = () => {
        return !defaultValues || defaultValues && getObjectKeys(defaultValues).every(key => {
            defaultValues[key] === watch(key)
        })
    }

    useEffect(() => {
        if (defaultValues && initialized) {
            getObjectKeys(defaultValues).forEach(key => {
                setValue(key, defaultValues[key])
            })
        } else {
            ref.current = true
        }
    }, [defaultValues, ref])

    return {
        ...state,
        errors: state.formState.errors,
        checkChanges
    }
}