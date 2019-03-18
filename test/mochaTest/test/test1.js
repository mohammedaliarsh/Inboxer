var supertest = require("supertest");
// for running it env KEY=local mocha
var should = require("should");
// var sleep =require("sleep")
// var path = require('path');
// This agent refers to PORT where program is runninng.
var config = require("../../../config/" + process.env.KEY + "/config.json");
var MongoClient = require('mongodb').MongoClient;
var url = `mongodb://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: config.elasticsearch.host + ":" + config.elasticsearch.port,
    // log: 'trace'
});
// var server = supertest.agent(config.api.url+":"+config.api.port);
var server = supertest.agent(config.api.url);

var clId = 2;
describe("searchsuggestions", function () {
    this.timeout(150000);
    before(function (done) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            else {
                console.log("connected successfully");
                db.collection("terms").remove({}, function (err, resss) {
                    db.collection("item_similarity").remove({}, function (err, reeeee) {
                        client.indices.delete({
                            index: clId + "*"
                        }, function (err, res) {

                            if (err) {
                                console.error(err.message);
                            } else {
                                done()
                                // console.log('Indexes have been deleted!');
                            }
                        });

                    })

                })

            }
        });

    });
    after(function (done) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            else {
                console.log("connected successfully");
                db.collection("terms").remove({},function (err,resss) {
                    db.collection("item_similarity").remove({},function (err,reeeee) {
                        client.indices.delete({
                            index: clId+"*"
                        }, function(err, res) {

                            if (err) {
                                console.error(err.message);
                            } else {
                                done()
                                // console.log('Indexes have been deleted!');
                            }
                        });
                    })

                })

            }
        });

    });


    it("basic test", function (done) {
        var client = {clId: clId, apiKey: "H1MpkQSNu-"};
        var data = [
            [{term: "mumbai", tId: 15,desc:"maharastra"}, {term: "lucknow", tId: 87,desc:"up"}, {term: "dath", tId: 522,desc:"mp"}],
            [{term: "mumbai", tId: 15,desc:"maharastra"}, {term: "vizianagaram", tId: 103,desc:"ap"}, {term: "patna", tId: 60,desc:"bihar"}, {
                term: "lucknow",
                tId: 87,
                desc:"up"
            }],
            [{term: "mumbai", tId: 15,desc:"maharastra"}, {term: "lucknow", tId: 87,desc:"up"}, {term: "dath", tId: 522,desc:"mp"}],
            [{term: "vizianagaram", tId: 103,desc:"ap"}, {term: "patna", tId: 60,desc:"bihar"}],
            [{term: "dath", tId: 522,desc:"mp"}, {term: "patna", tId: 60,desc:"bihar"}],
            [{term: "patna", tId: 60,desc:"bihar"},{term: "vizianagaram", tId: 103,desc:"ap"}]

        ]
        var past = [
            [{term: "patna", tId: 60}]
        ]
        var ex_res = [
            [
                [{
                    "term": "vizianagaram",
                    "id": 103,
                    "desc":"ap"
                }],
                {
                    "term": "mumbai",
                    "id": 15,
                    "desc":"maharastra"
                },
                {
                    "term": "dath",
                    "id": 522,
                    "desc":"mp"
                },
                {
                    "term": "lucknow",
                    "id": 87,
                    "desc":"up"
                }

            ]
        ]

        // console.log(data[0])
        function loop1(i) {
            if (i == data.length) {
                // sleep(2000)
                function rotate(j) {
                    if (j == past.length) {
                        done()

                    }
                    else {
                        setImmediate(function () {
                            console.log("naresh")
                            server
                                .post('/completeSearch/getSimilarity')
                                .send({
                                    "clId": client.clId,
                                    "apiKey": client.apiKey,
                                    "past": past[j]
                                })
                                .expect("Content-type", /json/)
                                .expect(200)
                                .end(function (err, res) {
                                    res.status.should.equal(200);
                                    for (k = 0; k < ex_res[j][0].length; k++) {
                                        res.body[k].term.should.equal(ex_res[j][0][k].term)
                                    }
                                    var dem = 0;
                                    for (n = 1; n < ex_res[j].length; n++) {
                                        for (l = ex_res[j][0].length; l < res.body.length; l++) {
                                            if (ex_res[j][n].term == res.body[l].term) {
                                                dem = dem + 1;
                                            }
                                        }
                                    }
                                    console.log("dem", dem)
                                    dem.should.equal(ex_res[j].length - 1);
                                    setTimeout(function () {
                                        rotate(++j)
                                    }, 6000)
                                    // rotate(++j)
                                });

                        })
                    }
                }

                var j = -1;
                setTimeout(function () {
                    rotate(++j)
                }, 6000)
                // rotate(++j);
            }
            else {
                setImmediate(function () {
                    // console.log(data[0]);

                    //calling ADD api
                    // console.log(data[0])
                    // console.log(client.clId)
                    // console.log(client.apiKey)

                    // var reqData = {}
                    // reqData.clId = client.clId;
                    // reqData.term = data[i];
                    // reqData.apiKey = client.apiKey;

                    //expected
                    server
                        .post('/completeSearch/updateSimilarTerms')
                        .send({
                            "clId": client.clId,
                            "apiKey": client.apiKey,
                            "term": data[i]

                        })
                        .expect("Content-type", /json/)
                        .expect(200)
                        .end(function (err, res) {
                            // res.status.should.equal(200);
                            console.log("turn", i)
                            loop1(++i)

                        });
                })

            }
        }

        var i = -1;
        loop1(++i);
    })
});




