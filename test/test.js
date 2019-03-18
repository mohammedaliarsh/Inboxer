// var events = require('events');
// var tmtMsgAckEventEmiter = new events.EventEmitter();
// tmtMsgAckEventEmiter.setMaxListeners(0);
// var flag = false;
// var i = 0, j = 0;
// setInterval(function () {
//     if (!flag) {
//         if (i === 10) {
//             tmtMsgAckEventEmiter.emit("hai", true);
//             flag = true;
//         }
//         tmtMsgAckEventEmiter.once("hai", function (ack) {
//             if (ack) {
//                 console.log("At ack State", j);
//                 hai(++j);
//             }
//         });
//         ++i;
//     } else {
//         console.log("After Completer of event", j);
//         hai(++j);
//
//     }
//
// }, 1000);
//
// function hai(i) {
//     console.log(i);
// }


// var events = require('events');
// var tmtMsgAckEventEmiter = new events.EventEmitter();
// tmtMsgAckEventEmiter.setMaxListeners(0);
// var isBinding = true;
// var bindedEvent = "binded";
// var i = 0;
// setTimeout(function () {
//     isBinding = false;
//     tmtMsgAckEventEmiter.emit(bindedEvent);
// }, 4000)
// function consume(msg) {
//     if (isBinding) {
//         tmtMsgAckEventEmiter.once(bindedEvent, function () {
//             console.log("pushed to tmta", msg);
//         });
//     }
//     else {
//         console.log("pushed to tmta", msg);
//     }
// }
//
// while (i < 5) {
//     consume(i);
//     i++;
// }
//
// setTimeout(function () {
//     while (i < 11) {
//         consume(i);
//         i++;
//     }
// }, 6000)

var tempresArry = [{id: 4, term: "t1"}, {id: 3, term: "t3"}, {id: 5, term: "t5"}]
var resArry = [];
var refObj = {}
for (var i = 0; i < tempresArry.length; i++) {
    var obj = tempresArry[i]
    resArry.push(obj);
    var index = resArry.length - 1;
    refObj[obj.id] = index
}
var dbArry = [{id: 3, term: "t3", desc: "t3desc"}, {id: 4, term: "t1", desc: "t4desc"}, {
    id: 5,
    term: "t5",
    desc: "t5desc"
}]

for (var i = 0; i < dbArry.length; i++) {
    var dbObj = dbArry[i]
    resArry[refObj[dbObj.id]].desc = dbObj.desc
}
console.log(resArry)