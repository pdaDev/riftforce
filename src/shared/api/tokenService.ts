import { BASE_URL } from ".."
import { api } from "./api"


export class TokenService {
    saveToken = (token: string) => localStorage.setItem('token', token)
    getToken = () => localStorage.getItem('token')
    refreshAccessToken = async () => {
    try {
            const response = await api.post(BASE_URL + '/auth/refresh').then(data => data)
            
            if (response.status === 200) {
                this.saveToken(response.data.access)
                return response.data.access
            }

            throw new Error('can not refresh access token')
        } catch (e) {
            throw new Error('error in token refresh')
        }
    }
    clearToken = () => localStorage.removeItem('token')
    addTokenHeaderToConfig = (config: { headers: { Authorization?: string } }, token?: string) => {
        const tokenForHeader = token || this.getToken()
        
        if (tokenForHeader) {
            config.headers['Authorization'] = `Bearer ${tokenForHeader}`
        }
    }
}

export default new TokenService()