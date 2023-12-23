import { makeAutoObservable } from "mobx"
import { IOption } from "../types"

export interface ISortingProps {
    defaultSort?: string
    defaultSortOptions?: IOption[]
    onSortActions?: () => Promise<any> | void
}

const DEFAULT_SORT = ''

export class SortingController {
    sort: string = DEFAULT_SORT
    defaultSortOptions: IOption[] = []
    defaultSort: string = DEFAULT_SORT
    private onSortAction?:  () => Promise<any> | void
    
    constructor(props?: ISortingProps) {
        if (props) {
            const { defaultSort, defaultSortOptions } = props
            this.defaultSortOptions = defaultSortOptions || []
            this.sort = defaultSort || DEFAULT_SORT
            this.onSortAction = props.onSortActions
            this.defaultSort = defaultSort || DEFAULT_SORT
        }
     
        makeAutoObservable(this)
    }

    setSort = async (sort: string) => {
        this.sort = sort
        if (this.onSortAction !== undefined)
            await this.onSortAction()
        
    }

    setOnSortAction = (action: () => Promise<any> | void) => {
        this.onSortAction = action
    }

    reset = () => {
        this.sort = this.defaultSort
    }
}