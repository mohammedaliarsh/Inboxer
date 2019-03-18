var redis = require('redis');
var client = redis.createClient(6379, '192.168.1.169');

// client.on('connect', function() {
//     console.log('connected');
// });
// client.sadd(['clId1','u1','u2','u3'],function (err,reply) {
//     console.log(reply);
//
// });
// client.smembers('clId1',function (err,reply) {
//     console.log(reply[0]);
//
// });
client.del("2:urs:",function (err,reply) {
    console.log(reply);

});
// var g=1
// client.del('1:2',function (err,reply) {
//     console.log(reply);
//
// });
// client.del("2:urs:16",function (err,reply) {
//     console.log(reply)
//
// })
// client.zrange("1:3", 0, -1, function (err, reply) {
//     console.log(reply)
// })

// client.hincrby("term_scores","term1",5,function (err,reply) {
//     console.log(reply)
//
// })
