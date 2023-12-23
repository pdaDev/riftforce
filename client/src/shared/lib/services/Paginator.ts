import { makeAutoObservable } from "mobx"

export interface IPaginationProps {
    defaultLimit?: number
    defaultPage?: number
    onPageChangeAction?: () => Promise<any> | void
}

const DEFAULT_LIMIT = 10

export class PaginationController {
    private defaultPage: number
    private defaultLimit: number
    limit: number
    page: number
    size: number = 0
    private onPageChangeAction?: () => Promise<any> | void
   
    constructor (props?: IPaginationProps ) {
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

    get cursor () {
        return this.page * this.limit
    }

    setLimit = (limit: number) => {
        this.limit = limit
    }


    setPage = async (page: number) => {
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

    paginateData = (data: any[]) => {
        return data.slice(this.cursor, this.cursor + this.limit)
    }

    get isLastPage () {
        return this.page === this.pageCount - 1
    }

    get isFirstPage () {
        return this.page === 0
    }
}