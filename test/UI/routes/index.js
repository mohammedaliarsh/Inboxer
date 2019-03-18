var express = require('express');
var router = express.Router();
var config = require("../../../config/" + process.argv[2] + "/config.json")
// var MongoClient = require('mongodb').MongoClient;
// var mongoConfig = {
//     host: "192.168.1.169",
//     port: 27017,
//     database: "maildb",
//     username: "maildb",
//     password: "arakumail"
// }
var isInitiated = false;
var mdb;
router.use(function (req, res, next) {
    //some initiations
    next();
    // if (!isInitiated) {
    //     var url = url = 'mongodb://' + mongoConfig.username + ":" + mongoConfig.password + "@" + mongoConfig.host + ':' + mongoConfig.port + '/' + mongoConfig.database;
    //     MongoClient.connect(url, function (err, db) {
    //         if (err) {
    //             throw new Error(err)
    //         }
    //         mdb = db;
    //         isInitiated = true;
    //         next();
    //     })
    // }
    // else {
    //     next()
    // }
});
router.post('/getConfig', function (req, res) {
    res.json({url: config.api.url})
    // console.log("ch1")
    // var data = mdb.collection('cities1');
    // data.find({}).toArray(function (err, cities) {
    //     if (err) {
    //         throw new Error(err)
    //     }
    //     console.log(cities)
    //     res.json(cities)
    // });
});
router.post('/getMasterData', function (req, res) {
    res.end("request not serving now")
    // console.log("ch1")
    // var data = mdb.collection('cities1');
    // data.find({}).toArray(function (err, cities) {
    //     if (err) {
    //         throw new Error(err)
    //     }
    //     console.log(cities)
    //     res.json(cities)
    // });
});
router.post('/updateUserSearched', function (req, res) {
    res.end("ok updateUserSearched")
});
router.post('/insertNewSearchWords', function (req, res) {
    res.end("ok insertNewSearchWords")
});
module.exports = router;