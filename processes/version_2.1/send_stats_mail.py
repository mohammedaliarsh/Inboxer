# -*- coding: utf-8 -*-
import os
import json
from utilities import connections, get_time
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import time
import requests


class send_stats:
    def __init__(self, config):
        path = "../../config/" + config
        with open(os.path.join(path, 'config.json')) as data_file:
            data = json.load(data_file)
        con_obj = connections.connections()
        self.mongo_db = con_obj.get_mongo_connection(data)
        self.sender = 'kamesh.happy@gmail.com'
        self.password = "way2online"
        # self.receivers = 'bsr2test@gmail.com'
        self.receivers = ['kameswararao.n@way2online.com', 'surya@way2online.net' , 'mahamdali.s@way2online.co.in']

    def get_data_from_db_and_send_mail(self):
        ret_str_dict = self.get_data_from_db_modify()
        ret_str = ret_str_dict["text"]
        ret_dict = ret_str_dict["dict"]
        display_str = '<div dir="ltr"><table cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none"><colgroup><col width="100"><col width="100"></colgroup><tbody><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">inbox %</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">campaigns</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">>90%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">@90@</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">>80%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">@80@</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">>70%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">@70@</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">>60%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">@60@</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)"><60%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">@50@</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">total</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">@100@</td></tr></tbody></table></div>'
        display_str_1 = display_str.replace("campaigns", "domains")
        today_date = int(get_time.iso_format(get_time.datetime.now())) - 86400
        query = {'date': today_date, "partial_inbox_ratio": {"$exists": True}}
        result = list(self.mongo_db.daily_counts.find(query))
        greater_than_90 = 0
        greater_than_80 = 0
        greater_than_70 = 0
        greater_than_60 = 0
        greater_than_50 = 0
        total = len(result)
        for row in result:
            if row['partial_inbox_ratio'] > 90:
                greater_than_90 += 1
            elif row['partial_inbox_ratio'] > 80:
                greater_than_80 += 1
            elif row['partial_inbox_ratio'] > 70:
                greater_than_70 += 1
            elif row['partial_inbox_ratio'] > 60:
                greater_than_60 += 1
            else:
                greater_than_50 += 1
        # display_str = display_str.replace('@90@', str(greater_than_90)).replace('@80@', str(greater_than_80))
        # display_str = display_str.replace('@70@', str(greater_than_70)).replace('@60@', str(greater_than_60))
        # display_str = display_str.replace('@50@', str(greater_than_50)).replace('@100@', str(total))
        display_str_1 = display_str_1.replace('@90@', str(ret_dict['90'])).replace('@80@', str(ret_dict['80']))
        display_str_1 = display_str_1.replace('@70@', str(ret_dict['70'])).replace('@60@', str(ret_dict['60']))
        display_str_1 = display_str_1.replace('@50@', str(ret_dict['50'])).replace('@100@', str(ret_dict['total']))
        # display_str += display_str_1
        display_str_1 += self.convert_to_string(ret_str)
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "inboxer stats and metrics"
        msg['From'] = "Bhaskar Vuchentala"
        msg['To'] = ", ".join(self.receivers)
        html = MIMEText(display_str_1, 'html')
        msg.attach(html)
        trails_count = 0
        while True:
            try:
                server = smtplib.SMTP('smtp.gmail.com', 587)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self.sender, self.password)
                server.sendmail(self.sender, self.receivers, msg.as_string())
                break
            except Exception as e:
                print "Error: unable to send email", e
                trails_count += 1
                if trails_count == 5:
                    break
                time.sleep(300)

    @staticmethod
    def wanted_keys(record, keys):
        ret_dict = {}
        for key in keys:
            ret_dict[key] = record[key]
        return ret_dict

    @staticmethod
    def convert_to_string(msg):
        if isinstance(msg, str):
            msg = msg.decode('utf-8').encode('utf-8')
        else:
            msg = msg.encode('utf-8')
        return msg

    @staticmethod
    def decide_percentage(value, ret_dict):
        ret_dict['total'] += 1
        if value > 90:
            ret_dict['90'] += 1
        elif value > 80:
            ret_dict['80'] += 1
        elif value > 70:
            ret_dict['70'] += 1
        elif value > 60:
            ret_dict['60'] += 1
        else:
            ret_dict['50'] += 1

    @staticmethod
    def get_opens_percentage(subject, domain_name, date):
        send_request = {
            'subject': subject,
            'domain': domain_name,
            'date': date
        }
        headers = {'content-type': 'application/json', "api_key": "AdfujeqoivaHjseghuehrlAdkjguqrHIEW"}
        ret_data = requests.get("http://apiinbox.way2target.com/cmpRptSubjDomain", headers=headers,
                                data=json.dumps(send_request))
        ret_data = ret_data
        try:
            if ret_data.content in ['No Records Found', 'Subject Not Found']:
                return '--'
            ret_data = json.loads(ret_data.content)
            return round((float(ret_data['opens']) / ret_data['reach']) * 100, 2)
        except Exception as e:
            print e, 'eeeeeeeeeeeee'
            print ret_data, ret_data.content, 'ret_dataaaaaa'
            return '---'

    def get_data_from_db_modify(self):
        today_date = int(get_time.iso_format(get_time.datetime.now())) - 86400
        return_dict = {'90': 0, '80': 0, '70': 0, '60': 0, '50': 0, 'total': 0}
        inboxer_result = list(self.mongo_db.inboxer_eds_stats.find({"date": today_date}))
        html_text = '<table cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none"><colgroup><col width="499"><col width="121"><col width="182"><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"></colgroup><tbody><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">subject</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">domains</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">sender ID</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">Inboxer</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(234,209,220);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">EDS</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,244,200);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">Opens</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);text-align:center;border:1px solid rgb(204,204,204)">seeds</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(234,209,220);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(234,209,220);text-align:center;border:1px solid rgb(204,204,204)">seeds</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,244,200);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2"></td></tr>'
        data_taken_subjects = []
        for row in inboxer_result:
            subject_data = list(self.mongo_db.subject_master.find({"_id": row['subjId']}))
            if subject_data:
                subject = self.convert_to_string(subject_data[0]['subject'])
            else:
                continue
            if subject not in data_taken_subjects:
                data_taken_subjects.append(subject)
                print subject
            else:
                continue
            display_dict = {'ttl': {'inboxer_inbox': 0, 'inboxer_seed_count': 0, 'eds_inbox': 0, 'volume': 0, 'ttl': 0}}
            data = list(self.mongo_db.inboxer_eds_stats.find({"subjId": row['subjId'], "date": today_date}).sort(
                [("domain", 1)]))
            keys_list = ['inboxer_inbox', 'inboxer_seed_count', 'eds_inbox', 'volume']
            if data:
                for record in data:
                    for key in keys_list:
                        if key not in record:
                            record[key] = -1
                    dmn = record['domain']
                    if dmn in display_dict:
                        ret_dict = self.wanted_keys(record, keys_list)
                        display_dict[dmn][record['senderId']] = ret_dict
                    else:
                        ret_dict = self.wanted_keys(record, keys_list)
                        display_dict[dmn] = {
                            record['senderId']: self.wanted_keys(record, keys_list),
                            'ttl': {'inboxer_inbox': 0, 'inboxer_seed_count': 0, 'eds_inbox': 0, 'volume': 0, 'ttl': 0}
                        }
                    display_dict['ttl']['ttl'] += 1
                    display_dict[dmn]['ttl']['ttl'] += 1
                    for key in ret_dict:
                        display_dict['ttl'][key] += ret_dict[key]
                        display_dict[dmn]['ttl'][key] += ret_dict[key]
                tr_tag = '<tr><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">' + str(
                    subject) + '</td>'
                tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td>'
                tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td>'
                for k in ['inboxer_inbox', 'inboxer_seed_count', 'eds_inbox', 'volume']:
                    if k in ['inboxer_inbox', 'inboxer_seed_count']:
                        tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);text-align:center;border:1px solid rgb(204,204,204)"></td>'
                    else:
                        tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(234,209,220);text-align:center;border:1px solid rgb(204,204,204)"></td>'
                tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,244,200);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2"></td>'
                tr_tag += '</tr>'
                tr_tag = tr_tag.decode('utf-8')
                html_text += tr_tag
                for domain_name, value_1 in display_dict.items():
                    if domain_name == "ttl":
                        continue
                    else:
                        for sender_name, value_2 in value_1.items():
                            if sender_name == "ttl":
                                continue
                            else:
                                tr_tag = "<tr>" + '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">' + domain_name + '</td>'
                                tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">' + sender_name + '</td>'
                                for k in ['inboxer_inbox', 'inboxer_seed_count', 'eds_inbox', 'volume']:
                                    set_value = round(value_2[k], 2)
                                    if k == "inboxer_inbox":
                                        self.decide_percentage(set_value, return_dict)
                                    color = "234,209,220"
                                    set_color = 0
                                    if set_value < 75 and k == "eds_inbox":
                                        set_color = 1
                                    if set_value < 0:
                                        set_value = '--'
                                    if k == "inboxer_inbox":
                                        set_value = str(set_value) + "%"
                                    elif k == "eds_inbox" and set_value != "--":
                                        set_value = str(set_value) + "%"
                                    if set_color == 1 and set_value != "--":
                                        color = "225,0,0"
                                    if k in ['inboxer_inbox', 'inboxer_seed_count']:
                                        tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);text-align:center;border:1px solid rgb(204,204,204)">' + str(
                                            set_value) + '</td>'
                                    else:
                                        tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(' + color + ');text-align:center;border:1px solid rgb(204,204,204)">' + str(
                                            set_value) + '</td>'
                                open_percentage = self.get_opens_percentage(subject, domain_name, today_date)
                                if open_percentage not in ['--', '---']:
                                    set_open_percentage = str(open_percentage) + "%"
                                else:
                                    set_open_percentage = open_percentage
                                tr_tag += '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,244,200);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">' + str(
                                    set_open_percentage) + '</td>'
                                tr_tag += '</tr>'
                                html_text += tr_tag
                html_text += '<tr><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)">   </td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(243,243,243);text-align:center;border:1px solid rgb(204,204,204)"></td></tr>'
        html_text += '</tbody></table>'
        return {"text": html_text, "dict": return_dict}

# obj = send_stats("live")
# obj.get_data_from_db_and_send_mail()
