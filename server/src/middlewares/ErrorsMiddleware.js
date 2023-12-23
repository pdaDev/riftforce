const ErrorApi = require('../common/apiErrors')

module.exports = (err, req, res, next) => {
    if (err instanceof ErrorApi) {
        return res.status(err.status).json({ message: err.message, errors: err.errors })
    }

    console.log(err)

    res.status(500).json({ message: 'Server error' })
}