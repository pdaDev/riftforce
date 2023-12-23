const { login, logout, register, getUser, edit } = require('../services/UserService')
const { refreshToken } = require('../services/TokenService')
const AuthUserDTO = require('../dtos/authUserDTO')
const UserEditDTO = require('../dtos/userEditDTO')

const FifteenDaysInSeconds = 60 * 60 * 24 * 15
const refreshCookiesCode = 'refreshToken'

class UserController {
    _addRefreshTokenToCookiesAndReturnData = (res, data) => {

        res.cookie(refreshCookiesCode, data.refresh, { maxAge: FifteenDaysInSeconds, httpOnly: true })
        res.status(200)
        res.json(data)
    }

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body
            const data = await login(email, password)
 
            this._addRefreshTokenToCookiesAndReturnData(res, data)
        } catch (e) {
            next(e)
        }
    }
    
    register = async (req, res, next) => {
        try {
            const { name, password, email } = req.body
            const tokens = await register(email, name, password)
         
            this._addRefreshTokenToCookiesAndReturnData(res, tokens)
        } catch (e) {
            next(e)
        }
    }
    
    authme = async (req, res, next) => {
        try {
            const data = await getUser(req.userData.id)
            res.json(new AuthUserDTO(data))
        } catch (e) {
            next(e)
        }
    }

    refresh = async (req, res, next) => {
        try {
            const tokens = await refreshToken(req.cookies.refreshToken)
            this._addRefreshTokenToCookiesAndReturnData(res, tokens)
        } catch (e) {
            next(e)
        }
    }

    logout = async (req, res, next) => {
        try {
            await logout(req.userData.id)
            res.clearCookie(refreshCookiesCode)
            res.status(200).json({ result: "success" })
        } catch (e) {
            next(e)
        }
    }

    edit = async (req, res, next) => {
        try {
            const data = await edit(req.userData.id, new UserEditDTO(req))
            res.json(data)
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new UserController()