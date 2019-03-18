var path = require('path');
var moment = require('moment');
redis = require('redis'),
    scripto = require('redis-scripto'),
    field1 = 'ryX4IWONu-';
clId = 1;
uId = 3;
key = clId + ":" + uId;

client = redis.createClient(6379, '192.168.1.169') // creates a new redis client
scriptManager = new scripto(client); // creates new scripto manager
scriptManager.loadFromDir("./lua"); // load lua scripts from directory
var milliseconds = (new Date).getTime();
var func_name = "process";
scriptManager.run('hadd', [key], [field1, milliseconds, func_name], function (err, result) { // run first script, that sums test.field1 and test.field2
    console.log(result);
});
client.zrange(key, 0, -1, function (err, reply) {
    console.log(reply);

});