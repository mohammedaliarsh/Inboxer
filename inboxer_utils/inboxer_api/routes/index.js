var express = require('express');
var router = express.Router();
var async = require('async');
var time = require('time');
var config = require('../../../config/' + process.argv[2] + '/config.json');
var mongoCon = require('../connections/mongoConnection');
var redisCon = require('../connections/redisConnection');
var redisClient = null;
var commons = require("../commons");
var testConnectionAuth = function () {
    var opts = {
        host: config.redis.host,
        port: config.redis.port,
        auth: config.redis.auth,
        password: config.redis.password,
        db: config.redis.db
    };
    redisCon.createRedisConnection(opts, function (err, rdCli) {
        if (err) {
            throw new Error(err);
        }
        else {
            redisClient = rdCli;
        }
    })
};
var mongoClient = null;
var testMongoConnectionAuth = function () {
    var opts = {
        host: config.mongodb.host,
        port: config.mongodb.port,
        database: config.mongodb.db,
        auth: true,
        username: config.mongodb.user,
        password: config.mongodb.password
    };
    mongoCon.createMongoConnection(opts, function (err, db) {
        if (err) {
            throw new Error(err);
        }
        else {
            mongoClient = db;
        }
    })
};
testConnectionAuth();
testMongoConnectionAuth();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'Express'});
});

router.get('/sendData', function (req, res) {
    async.waterfall([function (callback) {
        if (req.headers["content-type"] !== "application/json" || req.headers.api_key !== config.Api_Key) {
            callback("Invaild Api Key", 403);
        }
        else {
            if (!req.body.body) {
                callback("Invalid Params Send:Body Can Not Be NULL", 404);
            }
            else if (!req.body.subj) {
                callback("Invalid Params Send:Subject Can Not Be NULL", 404);
            }
            else if (!Array.isArray(req.body.subj)) {
                callback("Subject Is Not Array", 405);
            }
            else if (req.body.subj.length === 0) {
                callback("Subject Array is Empty", 406);
            }
            else {
                commons.logger.info("given data is in correct format");
                redisClient.incr('request_data', function (err, res) {
                    if (err) {
                        commons.logger.error("redis connection error", err);
                        callback("Something went Wrong..", 404);
                    }
                    else {
                        var obj = {
                            input: {
                                'body': req.body.body,
                                'subj': req.body.subj
                            },
                            _id: res
                        };
                        callback(null, obj);
                    }
                });
            }
        }
    }, function (obj, callback) {
        mongoClient.collection(commons.collectionName.inputCollection).insertOne(obj, function (err, res) {
            if (err) {
                commons.logger.error("mongodb insertion error", err);
                callback("Something went Wrong..", 404);
            }
            else {
                commons.logger.info("inserted successfully");
                try {
                    redisClient.publish("mongo_id", obj._id);
                    callback("success", 200)
                }
                catch (Exception) {
                    commons.logger.error("Error while publishing..", Exception);
                    callback("Something went Wrong..", 404);
                }
            }
        });
    }
    ], function (err, status_code) {
        return res.json({
            'status': status_code,
            'msg': err
        });
    });
});

function insertInDb(data, ind, sendResult) {
    var oneRecord = data[ind];
    var testIdDomain = oneRecord.reqIbr.split('_');
    var testId = parseInt(testIdDomain[0]);
    var domainId = parseInt(testIdDomain[1]);
    mongoClient.collection(commons.collectionName.gmailData).find({
        'testId': testId,
        'domain': domainId,
        'toEmail': oneRecord.toEmail
    }).toArray(function (err, result) {
        if (err) {
            throw err;
        }
        else {
            console.log(testId + "=>" + domainId + "=>" + result.length);
            if (result.length == 0) {
                redisClient.incr('gmail_data', function (err, idKey) {
                    if (err) {
                        commons.logger.error("redis connection error", err);
                        callback("Something went Wrong..", 404);
                    }
                    else {
                        var insertObj = {
                            'testId': testId,
                            'domain': domainId,
                            'status': 0,
                            'type': oneRecord.type,
                            'time': time.time(),
                            '_id': idKey,
                            'toEmail': oneRecord.toEmail
                        };
                        mongoClient.collection(commons.collectionName.gmailData).insert(insertObj, function (err, result) {
                            if (err) {
                                if (err.code === 11000) {
                                    console.log("Duplicate records");
                                }
                                else {
                                    throw err;
                                }
                            }
                            else {
                                console.log(result.result);
                            }
                            if (ind + 1 < data.length) {
                                insertInDb(data, ind + 1, sendResult);
                            }else{
                                sendResult.send({"status": "ok"});
                            }
                        });
                    }
                });
            }
            else {
                console.log("Duplicate record");
                if (ind + 1 < data.length) {
                    insertInDb(data, ind + 1, sendResult);
                }else
                {
                    sendResult.send({"status": "ok"});
                }
            }

        }
    });
}

router.post("/readData", function (req, res, next) {
    var data = req.body;
    insertInDb(data, 0, res);
});
router.post("/liveEmails", function (req, res, next) {
    var body = req.body;
    var currentTime = time.time();
    var emailsList = body['emails'];
    mongoClient.collection(commons.collectionName.seedList).update({"email": {"$in": emailsList}}, {"$set": {"updton": currentTime}}, {multi: true}, function (err, result) {
        if (err) {
            throw err;
        }
        else {
            res.send({"status": "ok"})
        }
    });
});

router.post("/getConfig", function (req, res, next) {
    mongoClient.collection(commons.collectionName.extension).find({'_id': 1}, {
        'type': 1,
        '_id': 0
    }).toArray(function (err, result) {
        if (err) {
            throw err;
        }
        else {
            var type_1 = result[0]['type'];
            mongoClient.collection(commons.collectionName.extension).find({
                'type': type_1,
                '_id': {'$ne': 1}
            }).toArray(function (err_1, result_1) {
                res.send(result_1[0].config);
            })
        }
    });
});
router.post("/getLocalConfig", function (req, res, next) {
    mongoClient.collection(commons.collectionName.extension).find({'_id': 5}, {
        'type': 1,
        '_id': 0
    }).toArray(function (err, result) {
        if (err) {
            throw err;
        }
        else {
            var type_1 = result[0]['type'];
            mongoClient.collection(commons.collectionName.extension).find({
                'type': type_1,
                '_id': {'$ne': 1}
            }).toArray(function (err_1, result_1) {
                res.send(result_1[0].config);
            })
        }
    });
});

router.post("/getLabsConfig", function (req, res, next) {
    mongoClient.collection(commons.collectionName.extension).find({'_id': 6}, {
        'type': 1,
        '_id': 0
    }).toArray(function (err, result) {
        if (err) {
            throw err;
        }
        else {
            var type_1 = result[0]['type'];
            mongoClient.collection(commons.collectionName.extension).find({
                'type': type_1,
                '_id': {'$ne': 1}
            }).toArray(function (err_1, result_1) {
                res.send(result_1[0].config);
            })
        }
    });
});
module.exports = router;