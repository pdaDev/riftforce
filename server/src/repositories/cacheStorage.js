const Redis = require('redis')
const cli = Redis.createClient()
cli.connect()

module.exports = cli