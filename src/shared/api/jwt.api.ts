import axios from "axios"
import { BASE_URL } from "./api"
import tokenService from './tokenService'

export const privateApi = axios.create({
    baseURL: BASE_URL,
    validateStatus: (status: number) => {
        return status >= 200 && status <= 500
    }
})

privateApi.interceptors.request.use((config => {
    if (!(config as any)._sent) {
       tokenService.addTokenHeaderToConfig(config as any)
    }
    return config
}))

privateApi.interceptors.response.use(response => response, async (error )=> {
    const originalRequest = error.config

    if (error.response.status === 401 && error.config && !error.config._sent) {
        try {
            originalRequest._sent = true
            const newToken = await tokenService.refreshAccessToken()
            tokenService.addTokenHeaderToConfig(originalRequest, newToken)
        
            if (/"token":"/.test(originalRequest.data)) {
                originalRequest.data = `{"token": "${newToken}"}`
            }
            return privateApi(originalRequest)
        } catch (e) {
            console.error(e)
        }
    }
    throw new Error(error)
})