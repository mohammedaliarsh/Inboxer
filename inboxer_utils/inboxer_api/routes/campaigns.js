var express = require('express');
var router = express.Router();
var async = require('async');
var redisConnection = require('../connections/redisConnection');
var config = require('../../../config/' + process.argv[2] + '/config.json');
var shortid = require('shortid');
var redisClientListener = null;
var redisClientPublish = null;
var events = require("events");
var eventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(0);

function redisClinetConnectionListener() {
    var options = {
        "host": config.redis.host,
        "port": config.redis.port,
        "auth": config.redis.auth,
        "password": config.redis.password,
        "db": 1
    };
    redisConnection.createRedisConnection(options, function (err, redisCli) {
        if (err) {
            throw new Error(err);
        }
        else {
            redisClientListener = redisCli;
        }
    });
}
function redisClientConnectionPublish() {
    var options = {
        "host": config.redis.host,
        "port": config.redis.port,
        "auth": config.redis.auth,
        "password": config.redis.password,
        "db": 1
    };
    redisConnection.createRedisConnection(options, function (err, redisPublish) {
        if (err) {
            throw new Error(err);
        }
        else {
            redisClientPublish = redisPublish;
        }
    });
}
redisClinetConnectionListener();
redisClientConnectionPublish();
function listenRedisListener() {
    redisClientListener.subscribe("CIDataReceive");
    redisClientListener.on("message", function (channel, message) {
        // console.log(message);
        var data = JSON.parse(message);
        console.log("data receice from python ", data);
        if (data["error"]) {
            eventEmitter.emit(data["uniqueId"], "Error while predict data", null);
        }
        else {
            var performance = "";
            if (data["predict"] === "G") {
                performance = "good"
            }
            else if (data["predict"] === "E") {
                performance = "Excellent";
            }
            else {
                performance = "bad"
            }
            var prediction = {"cData": data["cData"], "performance": performance};
            eventEmitter.emit(data["uniqueId"], null, prediction)
        }
    });
}
var redisListener = false;
router.post('/checkCamapaignPerformance', function (req, res) {
    eachRequestProcessing(req, function (err, prepareObject) {
        // console.log(err,prepareObject);
        // process.exit(1);
        if (err) {
            res.json({
                "status": 400,
                "err": err,
                "result": null,
                "msg": "something went wrong"
            })
        }
        else {
            scheduleObject[prepareObject["uniqueId"]] = new Date().getTime();
            eventEmitter.once(prepareObject["uniqueId"], function (err, success) {
                delete scheduleObject[prepareObject["uniqueId"]];
                if (err) {
                    res.json({
                        "status": 400,
                        "err": "Something went wrong",
                        "result": null
                    });
                }
                else {
                    res.json({
                        "status": 200,
                        "err": null,
                        "result": success
                    });
                }
            });
            // console.log("i am Here");
            // process.exit();
            if (!redisListener) {
                // console.log("I am here");
                // process.exit();
                redisListener = true;
                listenRedisListener();
                console.log("listener Successfully");
                // process.exit(1);
                redisClientPublish.publish("CIDataSend", JSON.stringify(prepareObject));
            }
            else {
                redisClientPublish.publish("CIDataSend", JSON.stringify(prepareObject));
            }

        }
    })
});
router.get('/', function (req, res) {
    res.send("campaign Intelligence working....");
});

module.exports = router;
function eachRequestProcessing(request, callback) {
    var requestProcess = new getCampaignPerformance(redisClientListener, request);
    requestProcess.validateData(function (err, information, cData) {
        if (err) {
            callback(err, null);
        }
        else {
            console.log("information", information, cData);
            requestProcess.prepareData(information, function (err, prepareObject) {
                if (err) {
                    callback(err, null);
                }
                else {

                    prepareObject["cData"] = cData;
                    // process.exit(1);
                    console.log("data received", prepareObject);
                    callback(null, prepareObject);
                }
            });
        }
    });
}
var scheduleObject = {};
function timeDifferencewithRespectivePresent(previousTimeStamp) {
    return parseInt((new Date().getTime() - previousTimeStamp) / 1000)
}
function scheduler() {
    var remainKeys = Object.keys(scheduleObject);
    for (var eackKey = 0; eackKey < remainKeys.length; eackKey++) {
        // console.log("eachKey", remainKeys[eackKey], "timestamp", scheduleObject[remainKeys[eackKey]]);
        var timeDifference = timeDifferencewithRespectivePresent(scheduleObject[remainKeys[eackKey]]);
        // console.log("timedifference", timeDifference);
        if (timeDifference > 6) {
            var error = {"error": "decision making not working try again later"};
            // console.log()
            eventEmitter.emit(remainKeys[eackKey], error, null);
        }

    }
}
setInterval(function () {
    // console.log("schdule start", scheduleObject);
    scheduler()
}, 3000);
function getCampaignPerformance(redisClient, request) {
    this.redisClient = redisClient;
    this.request = request;
    this.checkTime = function (timeObject, callback) {
        console.log(timeObject);
        if (typeof timeObject["time"] === "undefined") {
            return callback("invalid data Found" + JSON.stringify(timeObject), null);
        }
        var timePresent = parseInt(timeObject["time"]);
        if (timePresent < 0 || timePresent > 2359) {
            return callback("inValid Time Send" + JSON.stringify(timeObject), null);
        }
        return callback(null, timePresent);
    };
}
getCampaignPerformance.prototype.validateData = function (callback) {
    if (this.request.headers["content-type"] !== "application/json" || this.request.headers.api_key !== config.Api_Key) {
        callback("invalid Api Key Send", null);
    }
    else {
        if (!this.request.body.info || !this.request.body.cData) {
            callback("data info Params not Send", null);
        }
        else if (!Array.isArray(this.request.body.info)) {
            callback("information Not In Array Format", null);
        }
        else {
            console.log(this.request.body.info);
            callback(null, this.request.body.info, this.request.body.cData);
        }
    }
};
getCampaignPerformance.prototype.prepareData = function (informationCampaignArray, callback) {
    var mainFunctions = this;
    var lastIndex = informationCampaignArray.length - 1;
    async.waterfall([function (callback) {
        mainFunctions.presentTime(informationCampaignArray[lastIndex], function (err, presentTime) {
            if (err) {
                callback(err, null);
            }
            else {
                var prePareObject = {};
                prePareObject["timeRecent"] = presentTime;
                console.log("get present Time", prePareObject);
                callback(null, prePareObject);
            }
        });
    }, function (prePareObject, callback) {
        mainFunctions.rateOfgrowth(informationCampaignArray[0],
            informationCampaignArray[lastIndex], function (err, rateOfChangePercentage) {
                if (err) {
                    callback(err, null);
                }
                else {

                    prePareObject["rateOfGrowth"] = rateOfChangePercentage;
                    callback(null, prePareObject);
                }
            });
    }, function (prePareObject, callback) {
        mainFunctions.presentOpenPercentage(informationCampaignArray[lastIndex], function (err, recentOpenPercentage) {
            if (err) {
                callback(err, null);
            }
            else {
                prePareObject["openRecent"] = recentOpenPercentage;
                callback(null, prePareObject);
            }
        });
    }, function (prePareObject, callback) {
        mainFunctions.durationOfCampaign(informationCampaignArray[0], informationCampaignArray[lastIndex], function (err, duration) {
            if (err) {
                callback(err, null);
            }
            else {
                prePareObject["duration"] = duration;
                callback(null, prePareObject);
            }
        })
    }, function (prePareObject, callback) {
        mainFunctions.uniqueIdGeneration(function (err, uniqueId) {
            if (err) {
                callback(err, null);
            }
            else {
                prePareObject["uniqueId"] = uniqueId;
                callback(null, prePareObject);
            }
        });
    }], function (err, prepareObject) {
        if (err) {
            callback(err, null);
        }
        else {
            console.log("prepareObject", prepareObject);
            callback(null, prepareObject);
        }
    });
};
// getCampaignPerformance.prototype.campaignDataSend = function (cData, callback) {
//
// };
getCampaignPerformance.prototype.presentTime = function (recentCampaignObject, callback) {
    this.checkTime(recentCampaignObject, function (err, recentTime) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, recentTime);
        }
    });
};
getCampaignPerformance.prototype.rateOfgrowth = function (startCampaignObject, recentCampaingObject, callback) {
    if (typeof recentCampaingObject["opens"] === "undefined") {
        return callback("invalid data send " + JSON.stringify(recentCampaingObject), null);
    }
    if (typeof startCampaignObject["opens"] === "undefined") {
        return callback("invalid data send " + JSON.stringify(startCampaignObject), null);
    }
    if (typeof recentCampaingObject["timeSlots"] === "undefined" || recentCampaingObject["timeSlots"] === 0) {
        return callback("timeSlots not Found " + JSON.stringify(recentCampaingObject), null);
    }
    // console.log("I am here");
    if (parseInt(recentCampaingObject["timeSlots"]) === 1) {
        return callback(null, parseFloat(recentCampaingObject["opens"]));
    }
    var rateOfgrowth = (parseFloat(recentCampaingObject["opens"]) - parseFloat(startCampaignObject["opens"]) ) /
        parseInt(recentCampaingObject["timeSlots"]);
    return callback(null, rateOfgrowth);
};
getCampaignPerformance.prototype.presentOpenPercentage = function (recentCampaignObject, callback) {
    if (typeof recentCampaignObject["opens"] === "undefined") {
        return callback("invalid data send" + JSON.stringify(recentCampaignObject), null);
    }
    return callback(null, parseFloat(recentCampaignObject["opens"]));
};
getCampaignPerformance.prototype.durationOfCampaign = function (startCampaignObject, recentCampaignObject, callback) {
    var mainFuntionthis = this;
    async.waterfall([function (callback) {
        mainFuntionthis.checkTime(startCampaignObject, function (err, startOpenRate) {
            if (err) {
                callback(err, null);
            }
            else {
                callback(null, startOpenRate);
            }
        });
    }, function (startOpenRate, callback) {
        mainFuntionthis.checkTime(recentCampaignObject, function (err, recentOpenRate) {
            if (err) {
                callback(err, null);
            }
            else {
                callback(null, startOpenRate, recentOpenRate);
            }
        });
    }, function (startOpenRate, recentOpenRate, callback) {
        var duration = (recentOpenRate - startOpenRate) + 15;//15mins because campaign start after 15mins then check after
        // 15 min
        callback(null, duration);
    }], function (err, duration) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, duration);
        }
    });
};
getCampaignPerformance.prototype.uniqueIdGeneration = function (callback) {
    try {
        var uniqueId = new Date().getTime() + shortid.generate();
        callback(null, uniqueId);
    }
    catch (exception) {
        callback(exception, null);
    }
};

