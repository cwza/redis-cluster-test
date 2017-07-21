const Redis = require('ioredis')

let redis = new Redis.Cluster([{
    port: 7000,
    host: '127.0.0.1'
}, {
    port: 7001,
    host: '127.0.0.1'
}], {
//   scaleReads: 'slave' // write to master, read from slave
//   scaleReads: 'all' // write to master, read from master or slave
})

module.exports = {redis}