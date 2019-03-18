var redis = require('redis');
exports.createRedisConnection = function (opts, callback) {
    if (!callback) {
        callback = function () {
        }
    }
    if (!opts.host || !opts.port) {
        return callback("invalid opts:" + JSON.stringify(opts));
    }
    if (opts.auth) {
        if (!opts.password) {
            return callback("invalid opts:" + JSON.stringify(opts));
        }
    }
    var redisCli;
    redisCli = redis.createClient({host: opts.host, port: opts.port, db: opts.db});
    redisCli.on("error", function (err) {
        console.log("REDIS ERROR:", err);
    });
    redisCli.on("connect", function () {
        if (!opts.auth) {
            return callback(null, redisCli);
        }
        redisCli.auth(opts.password, function (err) {
            if (err) {
                return callback(err);
            }
            return callback(null, redisCli);
        });
    });
};
