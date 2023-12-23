import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { privateApi } from "./jwt.api"
import { ErrorCatcherService } from "./errorCatcher"
import { makeObservable, observable } from "mobx"
import {
    CommonListPayload,
    NotificationService,
    NotificationType,
    NotificationVariant,
    StatusAction,
    getObjectKeys,
} from ".."

type Codes100 = 100 | 101 | 102 | 103
type Codes200 = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
type Codes300 = 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
type Codes400 =
    | 400
    | 401
    | 402
    | 403
    | 404
    | 405
    | 406
    | 407
    | 408
    | 409
    | 410
    | 411
    | 412
    | 413
    | 414
    | 415
    | 416
    | 417
    | 418
    | 419
    | 421
    | 422
    | 423
    | 424
    | 425
    | 426
    | 428
    | 429
    | 431
    | 449
    | 451
    | 499
type Codes500 =
    | 500
    | 501
    | 502
    | 503
    | 504
    | 505
    | 506
    | 507
    | 508
    | 509
    | 510
    | 511
    | 521
    | 522
    | 523
    | 524
    | 525
    | 526

type HTTPCode = Codes100 | Codes200 | Codes300 | Codes400 | Codes500

type CodeHandlerPayload = {
    message?: string
    action?: StatusAction
    title?: string
    extra?: any
}

type StatusCodeClass = 100 | 200 | 300 | 400 | 500
type ResponseDataType =
    | void
    | string
    | number
    | boolean
    | { message?: string; [key: string | number | symbol]: any }

type RequestConfig = AxiosRequestConfig<any> & {
    status?: Partial<Record<HTTPCode, CodeHandlerPayload | true>>
    statuses?: Partial<Record<StatusCodeClass, CodeHandlerPayload>>
    errorHandler?: (e: Error) => void
    errorMessage?: string
    key?: string
}

export class HTTPAxiosAPI {
    protected axios: AxiosInstance
    protected baseUrl: string
    protected defaultConfig?: RequestConfig
    loadingStatuses: Record<string, boolean> = {}

    constructor(
        baseUrl?: string,
        axios?: AxiosInstance,
        defConfig?: RequestConfig
    ) {
        this.axios = axios || privateApi
        this.baseUrl = baseUrl || ""
        this.get.bind(this)
        this.patch.bind(this)
        this.delete.bind(this)
        this.post.bind(this)
        this.put.bind(this)
        this.defaultConfig = defConfig
        makeObservable(this, {
            loadingStatuses: observable,
        })
    }

    setAxiosInstance = (axios: AxiosInstance) => {
        this.axios = axios
    }

    setBaseUrl = (baseUrl: string) => {
        this.baseUrl = baseUrl
    }

    protected transformListRequestPayloadToQuery = (
        url: string,
        { offset, limit, sort, filters, query }: CommonListPayload
    ) => {
        const offsetParam = `offset=${offset}`
        const limitParam = `limit=${limit}`
        const sortParam = sort ? `sort=${sort}` : undefined

        const transformBooleanValue = (value: any) => {
            if (typeof value === "boolean") {
                return value ? 1 : 0
            }

            return value
        }

        const filtersParams = filters
            ? getObjectKeys(filters).map((key) => {
                  const filterKey = `fltr:${key}`

                  if (Array.isArray(filters[key])) {
                      return (filters[key] as any[])
                          .map((value) => {
                              ;`${filterKey}=${transformBooleanValue(value)}`
                          })
                          .join("&")
                  }

                  return `${filterKey}=${transformBooleanValue}`
              })
            : []

        const queryParams = query
            ? getObjectKeys(query).map((key) => {
                  if (Array.isArray(query[key])) {
                      return (query[key] as any[])
                          .map((value) => {
                              ;`${key}=${transformBooleanValue(value)}`
                          })
                          .join("&")
                  }

                  return `${key}=${transformBooleanValue}`
              })
            : []

        const queryParam =
            queryParams.length > 0 ? queryParams.join("&") : undefined

        const filterParam =
            filtersParams.length > 0 ? filtersParams.join("&") : undefined

        return `${url}?${[
            offsetParam,
            limitParam,
            sortParam,
            filterParam,
            queryParam,
        ]
            .filter((key) => key)
            .join("&")}`
    }

    private processStatus<T extends ResponseDataType>(
        url: string,
        config?: RequestConfig
    ) {
        return (data: AxiosResponse<T>) => {
            this.setLoadingStatus(url, false, config)
            const STANDARD_SERVER_ERROR_MESSAGE = "SERVER ERROR"
            const STANDARD_ERROR_MESSAGE = "произошла ошибка"

            const { status } = data

            const is500 = status >= 500

            const statusCodeClass = Math.floor(status / 100) * 100

            const currentConfigStatuses = config?.statuses
                ? config?.statuses[statusCodeClass as StatusCodeClass]
                : undefined
            const defaultConfigStatuses = this.defaultConfig?.statuses
                ? this.defaultConfig?.statuses[
                      statusCodeClass as StatusCodeClass
                  ]
                : undefined
            const currentConfigStatus = config?.status
                ? config.status[status as HTTPCode]
                : undefined
            const defaultConfigStatus = this.defaultConfig?.status
                ? this.defaultConfig.status[status as HTTPCode]
                : undefined

            const conf =
                currentConfigStatus ||
                currentConfigStatuses ||
                defaultConfigStatus ||
                defaultConfigStatuses

            if (is500) {
                const message =
                    typeof conf === "boolean" && conf === true
                        ? typeof data.data === "object"
                            ? data.data?.message || STANDARD_ERROR_MESSAGE
                            : STANDARD_ERROR_MESSAGE
                        : (conf as CodeHandlerPayload).message ||
                          STANDARD_SERVER_ERROR_MESSAGE

                ErrorCatcherService.getInstance().setTotalError(status, message)
            }

            if (conf) {
                if (typeof conf === "boolean" && conf) {
                    NotificationService.getInstance().addNotification({
                        message:
                            typeof data.data === "object"
                                ? data.data.message || STANDARD_ERROR_MESSAGE
                                : STANDARD_ERROR_MESSAGE,
                        type: NotificationType.system,
                        variant: NotificationVariant.error as any,
                    })
                } else if (typeof conf === "object") {
                    const totalErrorsCodes = [
                        StatusAction.total_error,
                        StatusAction.total_error_disabled,
                    ]
                    if (conf.action && totalErrorsCodes.includes(conf.action)) {
                        if (conf.action === StatusAction.total_error) {
                            ErrorCatcherService.getInstance().setTotalError(
                                data.status,
                                conf.message || STANDARD_ERROR_MESSAGE
                            )
                        }

                        if (conf.action === StatusAction.total_error_disabled) {
                            ErrorCatcherService.getInstance().setTotalError(
                                data.status,
                                conf.message || STANDARD_ERROR_MESSAGE,
                                true
                            )
                        }
                    } else {
                        NotificationService.getInstance().addNotification({
                            title: conf?.title,
                            message:
                                conf.message || typeof data.data === "object"
                                    ? (data.data as { message?: string })
                                          ?.message || STANDARD_ERROR_MESSAGE
                                    : STANDARD_ERROR_MESSAGE,
                            type: NotificationType.system,
                            variant:
                                conf.action || status >= 400
                                    ? NotificationVariant.error
                                    : undefined,
                        })
                    }
                }
            }

            if (status >= 400) {
                return null
            }

            return data.data
        }
    }

    private processError = (url: string, config?: RequestConfig) => {
        return (e: Error) => {
            this.setLoadingStatus(url, false, config)
            const handler =
                config?.errorHandler || this.defaultConfig?.errorHandler
            const message =
                config?.errorMessage ||
                this.defaultConfig?.errorMessage ||
                "error"
            handler && handler(e)
            throw new Error(message)
        }
    }

    private getConfig = (config?: RequestConfig) => {
        if (config || this.defaultConfig) {
            const conigObject = config || {}
            const defConfigObject = this.defaultConfig || {}

            return { ...defConfigObject, ...conigObject } as RequestConfig
        }

        return undefined
    }

    private setLoadingStatus = (
        url: string,
        status: boolean,
        config?: RequestConfig
    ) => {
        const key = config && config.key ? config.key : url
        this.loadingStatuses[key] = status
    }

    async post<T extends ResponseDataType = void>(
        url: string,
        data: any,
        config?: RequestConfig
    ) {
        this.setLoadingStatus(url, true, config)
        return await this.axios
            .post<T>(this.baseUrl + url, data, this.getConfig(config))
            .then(this.processStatus(url, config))
            .catch(this.processError(url, config))
    }

    async get<T extends ResponseDataType = void>(
        url: string,
        config?: RequestConfig
    ) {
        this.setLoadingStatus(url, true, config)
        return await this.axios
            .get<T>(this.baseUrl + url, this.getConfig(config))
            .then(this.processStatus(url, config))
            .catch(this.processError(url, config))
    }

    async delete<T extends ResponseDataType = void>(
        url: string,
        config?: RequestConfig
    ) {
        this.setLoadingStatus(url, true, config)
        return await this.axios
            .delete<T>(this.baseUrl + url, this.getConfig(config))
            .then(this.processStatus(url, config))
            .catch(this.processError(url, config))
    }

    async patch<T extends ResponseDataType = void>(
        url: string,
        data: any,
        config?: RequestConfig
    ) {
        this.setLoadingStatus(url, true, config)
        return await this.axios
            .patch<T>(this.baseUrl + url, data, this.getConfig(config))
            .then(this.processStatus(url, config))
            .catch(this.processError(url, config))
    }

    async put<T extends ResponseDataType = void>(
        url: string,
        data: any,
        config?: RequestConfig
    ) {
        this.setLoadingStatus(url, true, config)
        return await this.axios
            .put<T>(this.baseUrl + url, data, this.getConfig(config))
            .then(this.processStatus(url, config))
            .catch(this.processError(url, config))
    }
}
