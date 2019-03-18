var redisConnection = require('../../inboxer_utils/inboxer_api/connections/redisConnection');
var config = require('../../config/local/config.json');
var options = {
    "host": config.redis.host,
    "port": config.redis.port,
    "auth": config.redis.auth,
    "password": config.redis.password,
    "db": 1
};
redisConnection.createRedisConnection(options, function (err, redisClient) {
    if (err) {
        console.log(err);
    }
    else {
        redisConnection.createRedisConnection(options, function (err, redisPublish) {
            if (err) {
                console.log(err);
            }
            else {
                redisClient.subscribe("CIDataSend");
                // redisClient.subscribe("pubsubhello");
                redisClient.on("message", function (channel, message) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var data = JSON.parse(message);
                        console.log(data);
                        redisPublish.publish("CIDataReceive", JSON.stringify({
                            "predict": "G",
                            "uniqueId": data["uniqueId"]
                        }));
                        console.log("channel", channel, "and message", message);
                    }
                });

            }
        });

    }
});