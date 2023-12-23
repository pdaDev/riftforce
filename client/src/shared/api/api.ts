import axios from "axios"

export const BASE_URL = 'http://localhost:3300/api/v1'

export const api = axios.create({
    baseURL: BASE_URL,
    validateStatus: (status: number) => {
        return status >= 200 && status <= 500
    }
})
