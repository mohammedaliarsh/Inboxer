var redis = require('redis');
var client = redis.createClient(6379, '192.168.1.169');

client.on('connect', function() {
    console.log('connected');
});
client.hmset("tools","webserver",['hi','hello'],"database","mongoDB","devops","jenkins",function(err,reply){
// console.log(err)
console.log(reply)
});
client.hgetall("tools",function(err,reply) {
    // console.log(err);
    console.log(reply);
});