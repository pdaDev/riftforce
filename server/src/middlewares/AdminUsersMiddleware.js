import ApiError from "../common/apiErrors"

export default (req, res, next) => {
    if (req.userData.isAdmin) {
       return next()
    }

    next(ApiError.Forbidden())
}