const redis = require('./cluster').redis




const test = async () => {
    console.log("======start=========")
    redis.set('foo', 'foo')
    let foo = await redis.get('foo')
    console.log('foo: ', foo)
    redis.del('foo')
    foo = await redis.get('foo')
    console.log('foo: ', foo)
}

test()