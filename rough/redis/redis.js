var redis = require('redis');
var client = redis.createClient(6379, '192.168.1.169');

client.on('connect', function() {
    console.log('connected');
})

client.auth("way2redis");
 // client.set('num', 15);

client.get('num', function(err, reply) {
    console.log(reply);
    g=reply
});
// client.incr('num', function (err, reply) {
//     // res.send("new term inserted successfully");
//     console.log(reply)
// });
