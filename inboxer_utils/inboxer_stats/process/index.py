from flask import Flask, render_template, request
from datetime import datetime
import datetime as d
import sys
import os
import json
from pymongo import MongoClient

app = Flask(__name__)

path = "../config/" + sys.argv[1]
with open(os.path.join(path, 'config.json')) as data_file:
    data = json.load(data_file)
client = MongoClient(data['mongodb']['host'], data['mongodb']['port'])
client.inboxer.authenticate(data['mongodb']['user'], data['mongodb']['password'], mechanism="SCRAM-SHA-1")
mongodb = client.inboxer


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


@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        if 'date' in request.form:
            date = request.form['date']
            date = datetime.strptime(date, '%Y-%m-%d')
            result = list(mongodb.daily_stats.find({'_id': int(iso_format(date))}))
            if result:
                return render_template('display.html', result=result[0])
            else:
                return 'Empty'
        else:
            result = list(mongodb.overall_stats.find({'_id': 1}))
            if result:
                return render_template('display.html', result=result[0])
            else:
                return 'Empty'


if __name__ == '__main__':
    app.run(debug=True)
