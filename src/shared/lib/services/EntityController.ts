import { makeAutoObservable } from "mobx";
import { FilterController } from "./Filtrator";
import { PaginationController, SortingController } from ".";
import { EntitiesAPI } from "..";


interface IWorkStatus {
    sorting: boolean
    pagination: boolean
    filtering: boolean
}

type IListManagerProps<T extends object = object, D extends object = {}, R extends object = object> = {
    filter?: FilterController 
    sorting?: SortingController
    pagination?: PaginationController
    workStatus?: Partial<IWorkStatus>
    api: EntitiesAPI<T, D, R>
    key: string
}

const DEFAULT_WORK_STATUS: IWorkStatus = {
    sorting: true,
    pagination: true,
    filtering: true
}

export type LoadType = 'page' | 'infinite-scroll'



export class EntityController<T extends object, D extends object = {}, R extends object = object> {
    sorter: SortingController | undefined
    paginator: PaginationController | undefined
    private defaultWorkStatus: IWorkStatus
    workStatus: IWorkStatus
    filterer: FilterController
    api: EntitiesAPI<T, D, R>
    key: string
    list: T[] = []
    data: R | null = null

    constructor({ pagination, key, api, filter, sorting, workStatus }: IListManagerProps<T, D, R>) {
        makeAutoObservable(this)
        this.sorter = sorting
        this.paginator = pagination
        this.filterer = filter || new FilterController()
        this.api = api
        this.key = key

        if (workStatus) {
            const initWorkStatus: IWorkStatus = {
                filtering: workStatus?.filtering ?? DEFAULT_WORK_STATUS.filtering,
                sorting: workStatus?.sorting ?? DEFAULT_WORK_STATUS.sorting,
                pagination: workStatus?.pagination ?? DEFAULT_WORK_STATUS.pagination
            }
            this.workStatus = initWorkStatus 
        } else {
            this.workStatus = DEFAULT_WORK_STATUS
        }
        this.defaultWorkStatus = {...this.workStatus}
    }

    setSortingWorkStatus = (status: boolean) => {
        this.workStatus.sorting = status
    }

    setPaginationWorkStatus = (status: boolean) => {
        this.workStatus.pagination = status
    }

    setFilteringWorkStatus = (status: boolean) => {
        this.workStatus.filtering = status
    }

    get entityLoading () {
        return this.api.loadingStatuses[this.entityKey]
    }

    get listLoading () {
        return this.api.loadingStatuses[this.listKey]
    }

    get listFetching () {
        return this.listLoading && this.paginator && this.paginator.page > 0
    }

    private get listKey() {
        return this.key + ':list'
    }

    private get entityKey() {
        return this.key + ':entity'
    }

    getList = async () => {
        if (this.api.getList) {
            const data = await this.api.getList({
                key: this.key,
                limit: this.paginator?.limit || 10,
                sort: this.sorter?.sort as any || null,
                filters: this.filterer.data as D,
                offset: this.paginator?.page || 0
           })
    
           if (data) {
                this.list = data.list
           }
        }
    }

    getData = async (id: string) => {
        if (this.api.getEntity) {
            const data = await this.api.getEntity(this.entityKey, id)

            if (data) {
                this.data = data
            }
        }
    }

    reset = () => {
        this.resetData()
        this.resetList()
        this.sorter?.reset()
        this.paginator?.reset()
        this.filterer.reset()
        this.workStatus = {...this.defaultWorkStatus}
    }

    resetData = () => {
        this.data = null
    }

    resetList = () => {
        this.list = []
    }
}