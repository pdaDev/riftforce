class ListPayloadDTO {
    constructor(req) {
        this.limit = req.query["limit"] || 10
        this.offset = req.query["offset"] || 0
        this.sort = req.query["sort"] || null
        this.user = req.query["user"] || null
        this.active = req.query["user"] || null

        this.filters = Object.keys(req.query)
            .filter((key) => /fltr:.+/.test(key))
            .reduce((acc, key) => {
                const filterKey = key.replace(/fltr:/, "")

                if (acc[filterKey]) {
                    acc[filterKey] = [acc[filterKey]]
                }

                if (Array.isArray(acc[filterKey])) {
                    acc[filterKey].push(req.query.key)
                } else {
                    acc[filterKey] = req.query[key]
                }

                return acc
            }, {})
    }
}

module.exports = ListPayloadDTO
