class ApiError extends Error {
    constructor(status, message, errors = []) {
        super(message)
        this.message = message
        this.status = status
        this.errors = errors
    }

    static NotFound(message, errors) {
        return new ApiError(404, message || 'Not found', errors)
    }

    static BadRequest(message, errors) {
        return new ApiError(400, message || 'Bad request', errors)
    }

    static Unauthorized(message, errors) {
        return new ApiError(401, message || 'Not authorized', errors)
    }

    static Forbidden(message, errors) {
        return new ApiError(403, message || 'Forbidden', errors)
    }

    static ServerError(message, errors) {
        return new ApiError(500, message || 'Server error', errors)
    }
}

module.exports = ApiError