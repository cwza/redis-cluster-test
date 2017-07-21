const Redis = require('ioredis')

let redis = new Redis({
  port: 7000,          // Redis port
  host: '127.0.0.1',   // Redis host
  family: 4,           // 4 (IPv4) or 6 (IPv6)
})

module.exports = {redis}