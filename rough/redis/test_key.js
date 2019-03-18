var redis = require('redis');
var client = redis.createClient(6379, '192.168.1.169');
lua_scripts = require('redis-lua')("/scripts")
client.on('connect', function() {
    console.log('connected');
});
lua_scripts(redis)
var uId=1;
var clId=2;
var key=clId+':'+uId
// client.sadd([key,'wait','school','u3'],function (err,reply) {
//     console.log(reply);
//
// });

// client.zadd(key, 'NX', 0,'some',function (err,reply) {
//     console.log(reply)
//
// })
// client.smembers(key,function (err,reply) {
//     console.log(reply);
//
// });
