const jwt = require('jsonwebtoken')
const ApiError = require('../common/apiErrors')
const tokenService = require('../services/TokenService')

module.exports = (req, res, next) => {
    try {
        const header = req.headers['authorization']

        if (header) {
            const token  = header.split(' ')[1]

            if (token) {
                const userData =  tokenService.validateAccessToken(token)
    
                if (userData) {
                    req.userData = userData
                    return next()
                }
            }
        }

        next(ApiError.Unauthorized())
    } catch (e) {
        next(ApiError.Unauthorized())
    }
}