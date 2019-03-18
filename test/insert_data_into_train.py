from pymongo import MongoClient
from datetime import datetime
import datetime as d


def iso_format(dt):
    try:
        utc = dt + dt.utcoffset()
    except TypeError:
        # print e
        utc = dt
    iso_string = datetime.strftime(utc, '%Y-%m-%d')
    iso_date = iso_string.format(int(round(utc.microsecond / 1000.0)))
    iso_date = iso_date.split('-')
    epoch_iso = d.datetime(int(iso_date[0]), int(iso_date[1]), int(iso_date[2])).strftime('%s')
    return epoch_iso


def start():
    client = MongoClient("localhost", 27017)
    db = client.read_mails
    db1 = client.inboxer
    result = db.mails_read_html.find({})
    print result.count()
    date = int(iso_format(datetime.now()))
    c = 1
    for record in result:
        record['prdon'] = date
        record['template'] = {'body': record['body'], 'subj': record['subject']}
        del record['body']
        del record['subject']
        del record['_id']
        record['_id'] = c
        c += 1
        db1.train_data.insert(record)


start()
