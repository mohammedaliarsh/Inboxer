import requests
import json


class send_mail:
    def __init__(self):
        pass

    @staticmethod
    def send_message(message, url):
        try:
            headers = {'content-type': 'application/json', "api_key": "AdfujeqoivaHjseghuehrlAdkjguqrHIEW"}
            return requests.post(url, headers=headers, data=json.dumps(message))
        except Exception as msg:
            return {"status": 403, "msg": msg}

    @staticmethod
    def send_report(message, url, failed_status=None):
        if failed_status:
            send_msg = message
        else:
            send_msg = message['output']
            send_msg['cData'] = message['cData']
        try:
            headers = {'content-type': 'application/json', "api_key": "AdfujeqoivaHjseghuehrlAdkjguqrHIEW"}
            return requests.post(url, headers=headers, data=json.dumps(send_msg))
        except Exception as msg:
            return {"status": 403, "msg": msg}
