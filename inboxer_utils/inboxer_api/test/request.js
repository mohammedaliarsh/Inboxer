var request = require("request");
var config = require('../config/local/config.json');


function startProcess() {
    var object ={
        "body" : "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>  <table style=\"padding: 0px; color: rgb(153, 153, 153); font-size: 10px; line-height: 1.5em; border:1px solid #fff;\" border=\"0\" bgcolor=\"#ffffff\" width=\"480\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\">       <tr>     <td style=\"padding: 5px 0px;\">If you are unable to view this mailer<a href=\"http://bounces.160by2.us/160by2email/MailStatus2E?id=139058&amp;nid=67264&amp;subid=26971980&amp;listid=175&amp;domainur=bounces.160by2.us&amp;schml=MTM5MDU4blcMjY5NzE5ODA=&amp;queue=q242&amp;action=viewbrowser&amp;cid=50\" style=\"color: rgb(153, 153, 153);\"> Click here </a> <br /> </td>    </tr>     </table>  <table style=\"max-width:600px; table-layout:fixed; margin:0 auto;\" border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\">       <tr>     <td><a href=\"http://bounces.160by2.us/160by2email/MailStatus2E?id=139058&amp;nid=67264&amp;cid=50&amp;subid=26971980&amp;listid=175&amp;domainur=bounces.160by2.us&amp;schml=MTM5MDU4blcMjY5NzE5ODA=&amp;queue=q242&amp;action=clicks&amp;forwardurl=25874\" style=\"outline:none; border:0px;\"><img alt=\"\" style=\"display:block; max-width:600px;\" border=\"0\" width=\"100%\" align=\"absbottom\" src=\"http://app.160by2.us/160by2email/newsletters/11_2017/29/29Nov2017102326_ex//jhbdd_jdfgss.jpg\" /></a></td>    </tr>     </table>  <table style=\"padding: 0px; color: rgb(153, 153, 153); font-size: 10px; line-height: 1.5em; border:1px solid #fff; \" border=\"0\" bgcolor=\"#ffffff\" width=\"480\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\">       <tr>     <td style=\"padding: 5px 0px;\">You have received this mail because you are a member of 160by2. To stop receiving these emails please <a href=\"http://bounces.160by2.us/160by2email/MailStatus2E?id=139058&amp;nid=67264&amp;subid=26971980&amp;listid=175&amp;domainur=bounces.160by2.us&amp;schml=MTM5MDU4blcMjY5NzE5ODA=&amp;queue=q242&amp;action=stop&amp;cid=50\" style=\"color: rgb(153, 153, 153);\">click here </a> to unsubscribe. <br /> </td>    </tr>     </table>      <img alt=\"\" src=\"http://bounces.160by2.us/160by2email/MailStatus2E?id=139058&amp;nid=67264&amp;subid=26971980&amp;listid=175&amp;domainur=bounces.160by2.us&amp;schml=MTM5MDU4blcMjY5NzE5ODA=&amp;queue=q242&amp;action=readstatus&amp;cid=50\" height=\"0px\" width=\"0px\" />      <img alt=\"\" src=\"http://lab5.160by2.us/UserEmailCountUpdate?emailEncode=YmhhcnRoY2gxMjhAZ21haWwuY29t&amp;newsLetterId=67264\" height=\"0px\" width=\"0px\" />  ",
        "subj" : [
            "buy the new skoda rapid now and pay in 2019"
        ]
    };
    request.get({
        headers: {'content-type': 'application/json', api_key: "zxoknKLJlkjllKJ123KLJlk8787o"},
        url: "http://192.168.0.36:3000/sendData",
        body: JSON.stringify(object)
    }, function (err, response, body) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(response.body);
        }
    });
}

function takeDataFromDb() {
    var mongoCon = require('../connections/mongoConnection');
    if (process.argv[2] === "local") {
        config = require('../config/local/config.json');
    }
    var mongoClient = null;
    var testMongoConnectionAuth = function () {
        var opts = {
            host: config.mongo_db.host,
            port: config.mongo_db.port,
            database: config.mongo_db.db,
            auth: true,
            username: config.mongo_db.user,
            password: config.mongo_db.password
        };
        mongoCon.createMongoConnection(opts, function (err, db) {
            if (err) {
                throw new Error(err);
            }
            else {
                mongoClient = db;
                mongoClient.collection('mails_read_html_new').find({"type": "inbox"}).limit(30).toArray(function (err, res) {
                    if (!err) {
                        for (var i = 0; i < res.length; i++) {
                            send_obj = {
                                "body": res[i]['template']['body'],
                                "subj": res[i]['template']['subj']
                            };
                            request.get({
                                headers: {'content-type': 'application/json', api_key: "zxoknKLJlkjllKJ123KLJlk8787o"},
                                url: "http://192.168.0.36:3000/sendData",
                                body: JSON.stringify(send_obj)
                            }, function (err, response, body) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log(response.body);
                                }
                            });
                        }
                    } else {
                        console.log(err);
                    }
                    db.close();
                });
            }
        })
    };
    testMongoConnectionAuth();
}

startProcess();
// takeDataFromDb();