function testRequest() {
    var request = require('request');
    request({
        "headers": {"content-type": "application/json", "api_key": "zxoknKLJlkjllKJ123KLJlk8787o"},
        method: "POST",
        "url": "http://localhost:8087/campaigns/checkCamapaignPerformance",
        "json": true,
        "body": {
            "cData": {"cId": 134545},
            "info": [{"time": "0900", "opens": -1}, {"time": "1215", "opens": 0, "timeSlots": 1}]
        }
    }, function (err, response) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("response", response.body, response.body.status);
        }
    });
}
setInterval(function () {
    testRequest();
}, 2000);
// var data = {};
// if (data["error"]) {
//     console.log("hi");
// }
// else {
//     console.log("hello");
// }
//
//
// var date = new Date().getTime();
// setInterval(function () {
//     console.log(timeDifferencewithRespectivePresent(date));
// }, 5000);

