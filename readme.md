# Redis Cluster Test Repo
[Redis Cluster Official Tutorial](https://redis.io/topics/cluster-tutorial)  
[Redis Cluster Official Specification](https://redis.io/topics/cluster-spec)

# Redis Cluster Local Lab
Download and install latest Redis
``` sh
wget http://download.redis.io/releases/redis-3.2.8.tar.gz
tar xzf redis-3.2.8.tar.gz
cd redis-3.2.8
make
```
Redis Cluster minimal config file example
```
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```
Create test directive and redis.conf in all subdirectory.
Create a redis.conf file inside each of the directories, from 7000 to 7005. As a template for your configuration file just use the small example above, but make sure to replace the port number 7000 with the right port number according to the directory name.
``` sh
mkdir cluster-test
cd cluster-test
mkdir 7000 7001 7002 7003 7004 7005
```
Open 6 terminal and run 6 redis server from 7000 to 7005.
``` sh
cd 7000
../src/redis-server ./redis.conf
```
Create the cluster
``` sh
gem install redis
../src/redis-trib.rb create --replicas 1 127.0.0.1:7000 127.0.0.1:7001 \
127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005
```
Test the cluster with redis-cli
``` sh
../src/redis-cli -c -h 127.0.0.1 -p 7000
cluster nodes
set foo aaa
get foo
set bar bbb
get bar
```
Test the cluster with ioredis
``` sh
cd <to repo root>
npm install
npm start
```

# Redis Cluster provision to 6 nodes
## Do followings at all node
* Install dependencies
``` sh
apt-get update -y && \
    apt-get install --no-install-recommends -y \
      net-tools supervisor ruby rubygems gettext make g++ build-essential libc6-dev git && \
    apt-get clean -y
gem install redis
```
* Build Redis from source
``` sh
cd /
wget -O redis.tar.gz http://download.redis.io/releases/redis-3.2.8.tar.gz
tar xzf redis.tar.gz
cd redis
make
```
``` sh
mkdir -p /redis-config
mkdir -p /redis-data
```
* Put redis.config file to /redis-config.  
/redis-data/ is the place where RDB and AOF files be stored. Maybe you may want mount /redis-data to some external disk.  
You can use this minimal settings with the official stable confige file example. [redis.conf](http://download.redis.io/redis-stable/redis.conf)
``` sh
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
dir /redis-data/
```
* Run redis
``` sh
/redis/src/redis-server /redis-config/redis.conf
```
## At any node run followings
* Create redis cluster
``` sh
ruby /redis/src/redis-trib.rb create --replicas 1 ${Node1_IP}:6379 ${Node2_IP}:6379 ${Node3_IP}:6379 ${Node4_IP}:6379 ${Node5_IP}:6379 ${Node6_IP}:6379
```
* Test redis cluster
``` sh
/redis/src/redis-cli -c -h ${AnyNodeIP} -p 6379
cluster nodes
```


# Redis Cluster Note
## Minimal Redis Cluster config file
``` sh
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

## Redis-cli command
``` sh
redis-cli -c -h 127.0.0.1 -p 7000 # connect to cluster
cluster nodes # list all cluster nodes info
```

## Create Redis Cluster
``` sh
/redis-trib.rb create --replicas 1 127.0.0.1:7000 127.0.0.1:7001 \
127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005
```

## Manual failover
Run at slave. Change slave to master and change master to slave
``` sh
cluster failover
```

## Reshard
currently there is no way for redis-trib to automatically rebalance the cluster checking the distribution of keys across the cluster nodes and intelligently moving slots as needed. This feature will be added in the future.
``` sh
./redis-trib.rb reshard 127.0.0.1:7000
./redis-trib.rb reshard --from <node-id> --to <node-id> --slots <number of slots> --yes <host>:<port>
```

## Add New Master and Slave to Cluster
``` sh
./redis-trib.rb add-node 127.0.0.1:7006 127.0.0.1:7000
./redis-trib.rb add-node --slave 127.0.0.1:7006 127.0.0.1:7000
./redis-trib.rb add-node --slave --master-id 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 127.0.0.1:7006 127.0.0.1:7000
./redis-trib.rb reshard --from <node-id> --to <node-id> --slots <number of slots> --yes <host>:<port>
```

## Remove Node from Cluster
### Remove slave
``` sh
./redis-trib del-node 127.0.0.1:7000 `<node-id>`
```
### Remove master
In order to remove a master node it must be empty. If the master is not empty you need to reshard data away from it to all the other master nodes before.
``` sh
./redis-trib.rb reshard --from <node-id> --to <node-id> --slots <number of slots> --yes 
./redis-trib del-node 127.0.0.1:7000 `<node-id>`
```

## Migrating to Redis Cluster
1. Stop Clients
2. Use BGREWRITEAOF to generate append only file of old instance
3. Save AOF file somewhere and stop old instances
4. Create redis clusters of N masters and N slaves with no data and AOF
5. Stop all the cluster nodes, move AOF file to cluster node
6. Restart all cluster nodes with the AOF file. At this time they'll complain that there are keys that should not be there 
7. Use redis-trib.rb fix <cluster node ip> to fix hash slot keys
8. Use redis-trib.rb check <cluster node ip> to make sure cluster is ok
9. Restart client and use a Redis cluster aware client library

# Redis Cluster Specification Note
## Keys distribution model
```
HASH_SLOT = CRC16(key) mod 16384
```
## MOVED Redirection
If the hash slot is served by the node, the query is simply processed, otherwise the node will check its internal hash slot to node map, and will reply to the client with a MOVED error, like in the following example:
```
GET x
-MOVED 3999 127.0.0.1:6381
```

# ioredis for redis cluster
see [ioredis](https://github.com/luin/ioredis) to get full official document
see [index.js](index.js) to get a runnable example.
## Basic
``` js
let cluster = new Redis.Cluster([{
    port: 7000,
    host: '127.0.0.1'
}, {
    port: 7001,
    host: '127.0.0.1'
}])
cluster.set('foo', 'bar');
cluster.get('foo').then((res) => {})
```
## Read-write splitting
1. "all": Send write queries to masters and read queries to masters or slaves randomly.
2. "slave": Send write queries to masters and read queries to slaves.
3. default is "master"
``` js
let cluster = new Redis.Cluster([/* nodes */], {
  scaleReads: 'slave'
});
cluster.set('foo', 'bar'); // This query will be sent to one of the masters.
cluster.get('foo', function (err, res) {
  // This query will be sent to one of the slaves.
});
```
In the code snippet above, the res may not be equal to "bar" because of the lag of replication between the master and slaves.
## Running commands to multiple nodes
Every command will be sent to exactly one node. For commands containing keys, (e.g. GET, SET and HGETALL), ioredis sends them to the node that serving the keys, and for other commands not containing keys, (e.g. INFO, KEYS and FLUSHDB), ioredis sends them to a random node.
``` js
const Promise = require('bluebird')
const flushAll = (cluster) => {
    let nodes = cluster.nodes('master')
    return Promise.map(nodes, (node) => {
        return node.flushdb()
    })
    // return Promise.all(masters.map((node) => {
    //     return node.flushdb()
    // }))
}

const getAllKeys = (cluster) => {
    let nodes = cluster.nodes('master')
    return Promise.map(nodes, (node) => {
        return node.keys('*')
    })
}

const test = async () => {
    keys = await getAllKeys(cluster)
}
```
## Transaction and pipeline in Cluster mode
All keys in a pipeline should belong to the same slot since ioredis sends all commands in a pipeline to the same node.
``` js
const Promise = require('bluebird')
const getValues = (cluster, keys) => {
    return Promise.map(keys, (key) => {
        return cluster.get(key)
    })
}

const delKeys = (cluster, keys) => {
    return Promise.map(keys, (key) => {
        return cluster.del(key)
    })
}

const test = async () => {
    values = await getValues(cluster, ['key1', 'key2']) 
}
```
## Pub/Sub
Pub/Sub in cluster mode works exactly as the same as in standalone mode. Internally, when a node of the cluster receives a message, it will broadcast the message to the other nodes.