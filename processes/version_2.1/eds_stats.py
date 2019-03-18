# -*- coding: utf-8 -*-
from utilities import connections, get_time
import requests
import os
import json
import urllib
import datetime
from datetime import timedelta

from utilities.logger import Logger

logger = Logger(__name__).get_logger()


class eds_stats_report:
    def __init__(self, config):
        path = "../../config/" + config
        with open(os.path.join(path, 'config.json')) as data_file:
            data = json.load(data_file)
        con_obj = connections.connections()
        self.mongo_db = con_obj.get_mongo_connection(data)

    @staticmethod
    def convert_to_string(msg):
        if isinstance(msg, str):
            msg = msg.decode('utf-8').encode('utf-8')
        else:
            msg = msg.encode('utf-8')
        return msg

    def get_data_from_eds(self, subject):
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-GB,en-US;q=0.8,en;q=0.6",
            "Connection": "keep-alive",
            "Cookie": "_ga=GA1.2.684031999.1526621073; intercom-id-pp8czxqt=10a2fd2d-920e-4451-9fb7-8289b61decdd; intercom-lou-pp8czxqt=1; _gid=GA1.2.486702565.1530330919; _gat=1; analystAuth=DjB24vWt8wlSqFC7WHWyeuRFOrUUUpDpkZ5B60dWQ44fX35WH7cgSadMCUrR9fNXZj2v217v+tj2hjTA/tM4ujBVp75Wwg+FJxnrr67UVorCc4ddVTYbLz+naozSez1PL5N0ywCgyTCGAf7mtNuOggZ+FUgNp+byhMba0HuAWKkNq83qtYbX7WnRY/y+5I2hxpPoCDHvbJKTI5L0JqXHRvlgwXMGnZ0d3TbXMJ9ibY8C/8AWbs0OYwQHAFIlVUXRg+pn1qQYAx2FzeFv0/xxn19ZaHIv88iuTDm5oH4yaGU=; intercom-session-pp8czxqt=Nkp2TUU5dS9WVHlFOHFGd3Q0UXNjN25BOG9LOWFCalZKbi9sSjdkWDF5dDBnYWxyTWgwVFdxNjhSMG9pQnFsbS0td08rT1N5dkJ5QVdaRlY0VGtoY2Z2Zz09--5f5c235699bdb2f59f6bd7432379b8fb3dba86ca",
            "Host": "1.app.emailanalyst.com",
            "Origin": "https://app.emailanalyst.com",
            "Referer": "https://app.emailanalyst.com/bin/",
            "User-Agent": "Mozilla/5.0(X11;Linuxx86_64)AppleWebKit/537.36(KHTML, likeGecko)Chrome/60.0.3112.90Safari/537.36"
        }
        y_m_d = datetime.datetime.now() - timedelta(days=1)
        ymd_today = "" + str(y_m_d.year) + "%2F" + str(y_m_d.month) + "%2F" + str(y_m_d.day)
        logger.info("ymd:" + str(y_m_d) + "==>" + str(ymd_today))
        subject_dict = {'subject': self.convert_to_string(subject)}
        old_data = {"subject=Luxury+watches+-+upto+70%25off": urllib.urlencode(subject_dict),
                    "startDate=2018%2F02%2F06": "startDate=" + str(ymd_today),
                    "endDate=2018%2F02%2F06": "endDate=" + str(ymd_today)
                    }
        url = "https://1.app.emailanalyst.com/rest/secure/campaign/search_within_deliverability?brands=&campaignIds=&cid=&cloudmarkIssues=indifferent&companies=&creative=indifferent&endDate=2018%2F02%2F06&espEndIp=&espRedirectDomain=&espRedirectString=&espStartIp=&facetOnBrand=false&facetOnCompany=false&facetOnFromAddress=false&facetOnIndustry=false&facetOnSendingDomain=false&facetOnTrafficEndpoint=false&fromAddress=&fromAddresses=&geographicRegions=&headerKey=&headerValue=&includeAverageReceiveTime=true&includePanel=true&includePerIspDeliverability=true&includeSeed=true&includeVcharacter=true&industries=&mobile=indifferent&mta=&noncommercialRollup=non-rollup&page=0&pageSize=10&requestingVersion=v3.2.20&setId=1038&startDate=2018%2F02%2F06&statesOfGeographicRegion=&subject=Luxury+watches+-+upto+70%25off=&useCache=true"
        for old in old_data:
            url = url.replace(old, old_data[old])
        response = requests.get(url, headers=headers)
        data = json.loads(response.content)
        if 'campaigns' in data:
            return data['campaigns']
        return None

    def get_data_from_db(self):
        today_date = int(get_time.iso_format(get_time.datetime.now())) - 86400
        file_name = "/root/inboxer/processes/log/" + str(today_date) + "_eds_stats.txt"
        fd = open(file_name, "w+")
        result = list(self.mongo_db.inboxer_eds_stats.find({"date": today_date, "status": {"$exists": False}}))
        crawled_subjects = []
        logger.info("today_date:" + str(today_date))
        for record in result:
            subjId = record['subjId']
            if subjId not in crawled_subjects:
                subject_data = list(self.mongo_db.subject_master.find({"_id": subjId}))
                subject = subject_data[0]['subject']
                try:
                    try:
                        write_str = str(subjId) + "==>" + self.convert_to_string(subject) + " -------completed\n"
                        logger.info(write_str)
                        fd.write(write_str)
                    except Exception as e:
                        logger.info(subject)
                        logger.info(e)
                    eds_result = self.get_data_from_eds(subject)
                    if eds_result:
                        for row in eds_result:
                            gmail_counts = row['ispToAggregateCounts']['gmail']
                            dis_str = str(row['fromEmailAddress']) + "," + str(
                                round(gmail_counts['inboxPercentage'], 2))
                            dis_str += "," + str(round(gmail_counts['spamPercentage'], 2)) + "," + str(row['volume'])
                            logger.info(dis_str)
                            write_str = str(row['fromEmailAddress']) + str(round(gmail_counts['inboxPercentage'], 2))
                            write_str += str(round(gmail_counts['spamPercentage'], 2)) + str(row['volume']) + "\n"
                            fd.write(write_str)
                            self.mongo_db.inboxer_eds_stats.update(
                                {'subjId': subjId, 'senderId': row['fromEmailAddress'], 'date': today_date}, {
                                    "$set": {"status": 1, "eds_inbox": round(gmail_counts['inboxPercentage'], 2),
                                             "eds_spam": round(gmail_counts['spamPercentage'], 2),
                                             'volume': row['volume'],
                                             "eds_raw": {"spam_count": gmail_counts['spamCount'],
                                                         'inbox_count': gmail_counts['inboxCount']}}}, multi=True)
                    else:
                        logger.info("No data-------------------------")
                except Exception as e:
                    try:
                        write_str = str(subjId) + "==>" + self.convert_to_string(subject) + " exception 999999999999999"
                        write_str += str(e) + "\n"
                        fd.write(write_str)
                        logger.info(write_str)
                    except Exception as e:
                        logger.info(subject)
                        logger.info(e)
                crawled_subjects.append(subjId)
            else:
                write_str = str(subjId) + "==>" + " duplicate*************************************\n"
                fd.write(write_str)
                logger.info(write_str)

# obj = eds_stats_report("live")
# obj.get_data_from_db()
