import { makeAutoObservable, makeObservable } from "mobx"

interface IFilterProps {
    key: string
    label: string
}

interface IOptionProps {
    value: string | number
    label: string
}

class Option {
    selected: boolean = false
    readonly value: string | number
    readonly label: string
    
    constructor({ value, label }: IOptionProps) {
        this.value = value
        this.label = label
    }

    select(value?: boolean) {
        this.selected = value || !this.selected
    }
}

interface ISingleValueProps extends IFilterProps {
    options: Option[]
}

interface IMultipleValueProps extends ISingleValueProps {

}

interface IBooleanFilter extends IFilterProps {
    defaultValue?: boolean
}

abstract class Filter {
    static type: string = ''
    readonly key: string
    readonly label: string

    constructor({ key, label }: IFilterProps) {
        this.key = key
        this.label = label
    }

    abstract getServerKey(): string[]
    abstract onChange(...any: any[]): void
    abstract reset(): void
}

export class Filterer {
    filters: Filter[] = []

    constructor() {
        makeAutoObservable(this )
    }

    withEqualFilter(props: ISingleValueProps) {
        this.filters.push(new EqualFilter(props))
        return this
    }

    withBooleanFilter(props: IBooleanFilter) {
        this.filters.push(new BooleanFilter(props))
        return this
    }

    withContainsFilter(props: IMultipleValueProps) {
        this.filters.push(new ContainsFilter(props))
        return this
    }

    getConcreteFilter = (key: string) => {
        return this.filters.find(filter => filter.key === key) || null
    }

    reset = () => {
        this.filters.forEach(filter => filter.reset())
    }
}



type FilterType = 'equal' | 'contains' | 'boolean'

abstract class OptionsFilter extends Filter {
    options: Option[] = []

    constructor (props: ISingleValueProps) {
        super(props)
        const { options } = props
        this.options = options.map(o => new Option(o))
    }

    reset = () => {
        this.options.forEach(o => o.select(false))
    }
}

export class EqualFilter extends OptionsFilter {
    type: FilterType = 'equal'

    constructor (props: ISingleValueProps) {
        super(props)

        makeObservable(this, {

        })
    }

    onChange = (key: string | number | null) => {
        if (key) {
            this.options.forEach(o => o.value === key ? o.select() : o.select(false)) 
        } else {
            this.reset()
        }
    }

    getServerKey(): string[] {
        const value = this.options.find(o => o.selected)

        if (value) {
            return [this.key, 'EQUAL', value.value.toString()]
        }

        return []
    }
}


export class ContainsFilter  extends OptionsFilter {
    type: FilterType = 'contains'

    constructor (props: IMultipleValueProps) {
        super(props)
        makeObservable(this)
    }

    onChange = (key: string | number | null) => {
        if (key) {
            this.options.forEach(o => o.value === key && o.select()) 
        } else {
            this.reset()
        }
    }

    getServerKey(): string[] {
        const values = this.options.filter(o => o.selected)

        if (values.length > 0) {
            return [this.key, 'EQUAL', ...values.map(o => o.value.toString())]
        }

        return []
    }
}

export class BooleanFilter extends Filter {
    value: boolean = false
    defaultValue: boolean
    type: FilterType = 'boolean'

    constructor (props: IBooleanFilter) {
        super(props)
        makeAutoObservable(this)

        const { defaultValue } = props
        this.value = !!defaultValue
        this.defaultValue = !!defaultValue
    }

    onChange = () => {
        this.value = !this.value
    }

    getServerKey(): string[] {
        return [this.key, 'EQUAL', this.value.toString()]
    }

    reset = () => {
        this.value = this.defaultValue
    }
}


export interface IPaginatorProps {
    defaultLimit?: number
    defaultPage?: number
    onPageChangeAction?: () => Promise<any> | void
}

const DEFAULT_LIMIT = 10

export class PaginatorStore {
    private defaultPage: number
    private defaultLimit: number
    limit: number
    page: number
    size: number = 0
    private onPageChangeAction?: () => Promise<any> | void
    
    constructor (props?: IPaginatorProps ) {
        this.limit = props?.defaultLimit || DEFAULT_LIMIT
        this.defaultLimit = this.limit
        this.page = props?.defaultPage || 0
        this.defaultPage = this.page
        this.onPageChangeAction = props?.onPageChangeAction
        makeAutoObservable(this)
    }

    setSize = (size: number) => {
        this.size = size
    }

    get pageCount () {
        return Math.ceil(this.size / this.limit)
    }

    setLimit = (limit: number) => {
        this.limit = limit
    }  

    setPage = (page: number) => {
        if (page > this.page) {
            this.setNextPage()
        } else if (page < this.page) {
            this.setPrevPage()
        }
    }

    setOnPageChangeAction = (action: () => Promise<any> | void) => {
        this.onPageChangeAction = action
    }

    setNextPage = async () => {
        if (!this.isLastPage) {
            this.page += 1

            if (this.onPageChangeAction) {
                await this.onPageChangeAction()
            }
        } 
    }

    setPrevPage = async () => {
        if (!this.isFirstPage) {
            this.page -= 1

            if (this.onPageChangeAction) {
                await this.onPageChangeAction()
            }
        }
    }

    resetPage = () => {
        this.page = this.defaultPage
    }

    resetLimit = () => {
        this.limit = this.defaultLimit
    }
    
    reset = () => {
        this.resetLimit()
        this.resetPage()
    }

    get isFirstPage () {
        return this.page === 0
    }

    get isLastPage () {
        return this.page === this.pageCount - 1
    }
}


interface IWorkStatus {
    sorting: boolean
    pagination: boolean
    filtering: boolean
}

type IListManagerProps = ISorterProps & IPaginatorProps & {
    filter?: Filterer 
    workStatus?: Partial<IWorkStatus> 
    loadType?: LoadType
    key: string
}

const DEFAUTL_WORK_STATUS: IWorkStatus = {
    sorting: true,
    pagination: true,
    filtering: true
}

export type LoadType = 'page' | 'infinite-scroll'

export interface ISorterProps {
    defaultSort?: string
    defaultSortOptions?: IOptionProps[]
    onSortActions?: () => Promise<any> | void
}

const DEFAULT_SORT = ''

export class SorterStore {
    sort: string = DEFAULT_SORT
    readonly defaultSortOptions: IOptionProps[] = []
    readonly defaultSort: string = DEFAULT_SORT
    private onSortAction?:  () => Promise<any> | void
    
    constructor(props?: ISorterProps) {
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
            {
                await this.onSortAction()
            }
        
    }

    setOnSortAction = (action: () => Promise<any> | void) => {
        this.onSortAction = action
    }

    reset = () => {
        this.sort = this.defaultSort
    }

    sortData = (data: any[]) => {
        if (this.sort) {
            const isDescending = this.sort.indexOf('-') === 0
            const key = isDescending ? this.sort.replace('-', '') : this.sort
            return data.sort((a, b) => isDescending ? b[key] - a[key] : a[key] - b[key])
        }
        return data
    }
}

// type MemedData<T extends object> = {
//     date: number
//     data: T | T[]
// }

export class ListManagerStore<T> {
    sorter: SorterStore
    paginator: PaginatorStore
    readonly key: string 
    loadType: LoadType
    private lastAction: any 
    private defaultWorkStatus: IWorkStatus
    private defaultLoadType: LoadType
    workStatus: IWorkStatus
    fetching: boolean = false
    loading: boolean = false
    filterer: Filterer = new Filterer()
    list: T[] = []
    data: T | null = null
    memoData: Map<any, any> = new Map()
    memoList: Map<any, any> = new Map()

    constructor(props: IListManagerProps) {
        this.key = props.key
        makeAutoObservable(this)
        this.sorter = new SorterStore(props)
        this.paginator = new PaginatorStore(props)
        // this.sorter.setOnSortAction()
        // this.filterer = props?.filter || new FiltererStore()
        if (props?.workStatus) {
            const workStatus: IWorkStatus = {
                filtering: props.workStatus.filtering ?? DEFAUTL_WORK_STATUS.filtering,
                sorting: props.workStatus.sorting ?? DEFAUTL_WORK_STATUS.sorting,
                pagination: props.workStatus.pagination ?? DEFAUTL_WORK_STATUS.pagination
            }
            this.workStatus = workStatus 
        } else {
            this.workStatus = DEFAUTL_WORK_STATUS
        }
        this.defaultWorkStatus = {...this.workStatus}
        this.loadType = props?.loadType || 'page'
        this.defaultLoadType = this.loadType
    }

    setSortingWorkStatus = (status: boolean) => {
        this.workStatus.sorting = status
    }

    setPaginationWorkStatus = (status: boolean) => {
        this.workStatus.pagination = status
    }

    setLoadType = (loadType: LoadType) => {
        this.loadType = loadType
    }

    setFilteringWorkStatus = (status: boolean) => {
        this.workStatus.filtering = status
    }
       
    startLoading = () => {
        this.loading = true

        if (this.paginator.page > 0) {
            this.fetching = true
        }
    }

    stopLoading = () => {
        this.loading = false
        this.fetching = false
    }

    // logAction = async (query: () => Query, formatData: (data: QuerySnapshot<DocumentData, DocumentData>) => Promise<T[]>) => {
    //     this.lastAction = async () => {
    //         try {
    //             const data = await getDocs(query())
    //             this.paginator.logPage(data.docs[data.docs.length - 1])
    //             const formattedData = await formatData(data)
    //             return formattedData 
    //           }
    //          catch (e) {
    //             ErrorCatcher.getInstance().throwTotalError({ code: 400, message: 'Произошла ошибка' })
    //             // ErrorCatcher.getInstance().throwErrorMessage('Не удалось загрузить файлы')
    //         }
    //     }
        
    //     this.runAction()
    // }
    
    runAction = async () => {
        if (typeof this.lastAction === 'function') {
            try {
                this.startLoading()
                const data = await this.lastAction()
                this.stopLoading()

            } catch (e) {
                console.log('одна ошибка и ты ошибся')
                this.stopLoading()
            }     
        }     
    }

    reset = () => {
        this.resetData()
        this.sorter.reset()
        this.paginator.reset()
        this.filterer.reset()
        this.workStatus = {...this.defaultWorkStatus}
        this.loadType = this.defaultLoadType
    }

    resetData = () => {
        this.data = null
        this.list = []
    }

    setLoadPerPage = () => {
        this.loadType = 'page'
    }

    setInfiniteScrollLoad = () => {
        this.loadType = 'infinite-scroll'
    }
}