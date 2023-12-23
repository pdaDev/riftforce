const jwt = require('jsonwebtoken')
const ApiError = require('../common/apiErrors')
const UserService = require('./UserService')
const cli = require('../repositories/cacheStorage')

const STANDARD_REFRESH_TOKEN_EXPIRATION_DATE = 60 * 60 * 24 * 15

class TokenService {
    _validateToken = (token, secretKey) => {
        try {
            return jwt.verify(token, secretKey)
        } catch (_) {
            return null
        }
    }
    validateAccessToken = (token) => {
       return this._validateToken(token, process.env.ACCESS_SECRET_KEY)
    }

    validateRefreshToken = (token) => {
        return this._validateToken(token, process.env.REFRESH_SECRET_KEY)
    }

    generateToken = async (user) => {
        const tokenPayload = { id: user._id, email: user.email, isAdmin: user.isAdmin }

        const access = jwt.sign(tokenPayload, process.env.ACCESS_SECRET_KEY)
        const refresh = jwt.sign(tokenPayload, process.env.REFRESH_SECRET_KEY) 

        this.saveRefreshToken(user._id, refresh)

        return {
            access,
            refresh
        }
    }

    saveRefreshToken = async (id, token) => {
        return new Promise((res) => {
            cli.setEx(this._maskKey(id), STANDARD_REFRESH_TOKEN_EXPIRATION_DATE, token)
            res()
        })
    }

    getToken = async (id) => {
        return new Promise((res) => {
            cli.get(this._maskKey(id), (error, data) => {
               res(error ? null : data)
            })
        })
    }

    refreshToken = async (refresh) => {
        if (!refresh) {
            throw ApiError.Unauthorized()
        }

        const tokenData = this.validateRefreshToken(refresh)
       

        if (!tokenData) {
            throw ApiError.Unauthorized()
        }

        const dbToken = await this.getToken(tokenData.id)

        if (!dbToken || dbToken !== refresh) {
            throw ApiError.Unauthorized()
        }

        const user = UserService.getUser(tokenData.id)
        return await this.generateToken(user)
    }

    _maskKey = (id) => {
        return `refresh_token_${id}`
    }

    // refresh_token_65724d991f9ffd25ae6d7c22

    clearToken = async (id) => {
        try {
            cli.del(this._maskKey(id))
        } catch (e) {
            console.log(e)
        }   
    }
}

module.exports = new TokenService()
