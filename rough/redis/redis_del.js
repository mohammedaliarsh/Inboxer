var redis = require('redis');
var client = redis.createClient(6379, '192.168.1.169');
require('redis-delete-wildcard')(redis);
client.on('connect', function() {
    console.log('connected');
});
//
// client.del("num",function (err,response1) {
//     console.log(response1)
//
// })
// client.get("num",function (err,resp) {
//     console.log(resp)
//
// })
// client.del("item_count",function (err,response2) {
//     console.log(response2)
//
// })

//deletes all keys which match the pattern

// client.delwild('model-*', function(error, numberDeletedKeys) {
//     console.log(numberDeletedKeys);
// });

//deletes all data in redis

// client.flushdb( function (err, succeeded) {
//     console.log(succeeded); // will be true if successfull
// });
