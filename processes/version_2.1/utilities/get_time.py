import time
from datetime import datetime
import datetime as d


def datetime_to_secs():
    return int(round(time.time()))


def secs_to_datetime(a):
    return datetime.fromtimestamp(a)


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
