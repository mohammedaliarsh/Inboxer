var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: "192.168.1.169" + ':' + "9200",
    log: 'trace'
});
// client.search({
//     index: "kam_index",
//     //
//     body: {
//         "sort": [{score: "desc"}],
//         // query: {
//         query: {
//             match: {
//                 "keywords":
//                     {query:"s"}
//             }
//         }
//     }
//     }
//
// ,function(err,response) {
//     if (err) {
//         console.log("Error in searching domain", err)
//     }
//     else {
//         console.log(response)
//     }
// });
// client.index({
//     index: 'ggg',
//     type: 'ibm',
//     id: 2,
//     body: {
//         keywords:"naresh",
//         score:0.7
//
//     }
// }, function (error, response) {
//
// })
client.search({
    index: "term:5",
    body: {
    "sort": [{score: "desc"}],

        "query": {
            "match_phrase_prefix": {
                "keyword": {
                    "query": "r",
                    "max_expansions":1
                }
            }
        }
    }
}, function (err, res) {
    // console.log(res.hits.hits[0]._source.keywords);
    // console.log(res.hits.hits[1]._source.keywords);
})
