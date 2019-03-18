var tracer = require('tracer');
var fs = require('fs');
var colors = require('colors');
var events = require('events');
var eventHandle = new events.EventEmitter();

exports.eventEmitter = eventHandle;

exports.logger = tracer.console({
    transport: function (data) {
        console.log(data.output);
        fs.appendFile('./logs/log_' + new Date().getDate() + "-" + new Date().getMonth() + "-" +
            new Date().getYear() + ".log", data.output + '\n', function (err) {
            if (err) {
                throw new Error("logger error" + err);
            }
        });
    },
    filters: {
        //log : colors.black,
        //trace: colors.magenta,
        debug: colors.blue,
        info: colors.green,
        //warn: colors.yellow,
        error: [colors.red, colors.bold]
    }
});
exports.getDateStamp = function () {
    var timeObj = {};
    var date = new Date();
    console.log(date);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }


    var dateStamp = Date.parse(year + "-" + month + "-" + day + " 00:00:00");
    return dateStamp / 1000;
};
exports.collectionName = {
    'inputCollection': "request_data",
    "gmailData": "gmail_data",
    "seedList": "seed_list",
    "extension": "extensionConfig"
};