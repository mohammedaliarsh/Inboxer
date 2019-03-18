import requests
import json
import string
import random


class send_mail:
    def __init__(self):
        pass

    @staticmethod
    def send_message(msg, msg_id):
        message = {
            "domainName": "congolop.com",
            "serverIp": "103.25.126.2",
            "email": "gopalway2@gmail.com",
            "subject": msg['subj'][0],
            "body": msg['body'],
            "fromname": "CongolopMail",
            "msgid": msg_id,
            "tsid": 342,
            "fromem": "career@congolop.com"

        }
        try:
            headers = {'content-type': 'application/json', "api_key": "skljdfJHudkje3jfalHULmdsliigjaNHHLLmdfaj"}
            r = requests.get('http://192.168.1.90:4000/sendMessage', headers=headers, data=json.dumps(message))
            for i in r:
                return i
        except Exception as msg:
            return {"status": 403, "msg": msg}


def id_generator(size, chars=string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


send_obj = send_mail()
send_msg = {
    "body": "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'> <head></head>   <table style=\"max-width:480px; padding: 0px; color: rgb(153, 153, 153); font-size: 10px; line-height: 1.5em; border:1px solid #fff;\" width=\"100%\" align=\"center\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" bgcolor=\"#ffffff\">         <tr>      <td style=\"padding: 5px 0px;\">If you are unable to view this mailer<a href=\"http://bounces.way2sms.in/w2email/MailStatus2E?id=451375&nid=212485&subid=93034222&listid=398&domainur=bounces.way2sms.in&schml=NDUxMzc1blcOTMwMzQyMjI=&queue=q19&action=viewbrowser&cid=62\" style=\"color: rgb(153, 153, 153);\"> Click here </a> <br /> </td>     </tr>       </table>   <table style=\"max-width:600px; table-layout:fixed; margin:0 auto; border:1px solid #000; font-family:Arial, Helvetica, sans-serif;\" width=\"100%\" align=\"center\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">         <tr>      <td><a href=\"http://bounces.way2sms.in/w2email/MailStatus2E?id=451375&nid=212485&cid=62&subid=93034222&listid=398&domainur=bounces.way2sms.in&schml=NDUxMzc1blcOTMwMzQyMjI=&queue=q19&action=clicks&forwardurl=60001\" style=\"outline:none; border:0px;\"><img alt=\"\" style=\"display:block; max-width:600px;\" width=\"100%\" align=\"absbottom\" border=\"0\" src=\"http://app.way2sms.biz/w2email/newsletters/11_2017/27/27Nov2017025242_ex//tyxdfg_jbhxd.jpg\" /></a></td>     </tr>     <tr>      <td style=\"padding:2px; font-size:9px; line-height:12px; text-align:justify;\"><a href=\"http://bounces.way2sms.in/w2email/MailStatus2E?id=451375&nid=212485&cid=62&subid=93034222&listid=398&domainur=bounces.way2sms.in&schml=NDUxMzc1blcOTMwMzQyMjI=&queue=q19&action=clicks&forwardurl=60001\" style=\"color:#20438a; font-weight:bold; text-decoration:none;\">reliancegeneral&Acirc;&shy;.co&Acirc;&shy;.in</a> I Call 1800 3009 (Toll free) I Disclaimers: Discount is applicable on OD premium. IRDAI Registration No. 103. Reliance General Insurance Company Limited. This advertisement is for Reliance Private Car Package Policy and Reliance Two Wheeler Package Policy. Registered Office: H Block, 1st Floor, Dhirubhai Ambani Knowledge City, Navi Mumbai-400710. Corporate Office: Reliance Center, South Wing, 4th Floor, Off. Western Express Highway, Santacruz (East) Mumbai 400055. Corporate Identity Number: U66603MH2000PLC128300. Trade Logo displayed above belongs to Anil Dhirubhai Ambani Ventures Private Limited and used by Reliance General Insurance Company Limited under License. RGI/OS/MOT-02/COMBO-MAILER/VER.1.0/300317.</td>     </tr>       </table>   <table style=\"max-width:480px; padding: 0px; color: rgb(153, 153, 153); font-size: 10px; line-height: 1.5em; border:1px solid #fff; \" width=\"100%\" align=\"center\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" bgcolor=\"#ffffff\">         <tr>      <td style=\"padding: 5px 0px;\">You have received this mail because you are a member of way2sms. To stop receiving these emails please <a href=\"http://bounces.way2sms.in/w2email/MailStatus2E?id=451375&nid=212485&subid=93034222&listid=398&domainur=bounces.way2sms.in&schml=NDUxMzc1blcOTMwMzQyMjI=&queue=q19&action=stop&cid=62\" style=\"color: rgb(153, 153, 153);\">click here </a> to unsubscribe. <br /> </td>     </tr>       </table> <img alt=\"\" src=\"http://bounces.way2sms.in/w2email/MailStatus2E?id=451375&nid=212485&subid=93034222&listid=398&domainur=bounces.way2sms.in&schml=NDUxMzc1blcOTMwMzQyMjI=&queue=q19&action=readstatus&cid=62\" height='0px' width='0px'>",
    "subj": [
        "savings and security for your car and bike."
    ]
}
msg_id = id_generator(25)
print msg_id
send_obj.send_message(send_msg, msg_id)
