router.post("/readDatas", function (req, res, next) {
    var data = req.body;
    data.forEach(function (oneRecord) {
        var testIdDomain = oneRecord.reqIbr.split('_');
        var testId = parseInt(testIdDomain[0]);
        var domainId = parseInt(testIdDomain[1]);
        mongoClient.collection(commons.collection_name.gmail_data).find({
            'testId': testId,
            'domain': domainId,
            'type': oneRecord.type
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
                                '_id': idKey
                            };
                            mongoClient.collection(commons.collection_name.gmail_data).insert(insertObj, function (err, result) {
                                if (err) {
                                    if (err.code === 11000) {
                                        console.log("Duplicate record");
                                    }
                                    else {
                                        throw err;
                                    }
                                }
                                else {
                                    console.log(result.result);
                                }
                            });
                        }
                    });
                    res.send({"status": "ok"});
                }
                else {
                    console.log("Duplicate record");
                    res.send({"status": "duplicate record"});
                }
            }
        })
    });
});