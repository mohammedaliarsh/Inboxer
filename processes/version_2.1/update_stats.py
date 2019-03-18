import json
import os
from utilities import connections, get_time


class update_stats():
    def __init__(self, config):
        path = "../../config/" + config
        with open(os.path.join(path, 'config.json')) as data_file:
            data = json.load(data_file)
        con_obj = connections.connections()
        self.mongo_db = con_obj.get_mongo_connection(data)

    def update_stats_in_db(self):
        today_date = int(get_time.iso_format(get_time.datetime.now()))
        form_insert_obj = {'dom_counts': {}, 'camp_trial_counts': {}, 'active_seed_counts': {},
                           'first_attempt_inbox': {}, 'partial_inbox_ratio': {}, 'camp_email_counts': {}}
        res = self.mongo_db.daily_counts.aggregate([{"$match": {"date": today_date}},
                                                    {"$group": {"_id": None,
                                                                "dom_avg": {"$avg": "$dom_count"},
                                                                "dom_min": {"$min": "$dom_count"},
                                                                "dom_max": {"$max": "$dom_count"},
                                                                "camp_avg": {"$avg": "$camp_trial_count"},
                                                                "camp_min": {"$min": "$camp_trial_count"},
                                                                "camp_max": {"$max": "$camp_trial_count"},
                                                                "email_avg": {"$avg": "$camp_email_count"},
                                                                "email_min": {"$min": "$camp_email_count"},
                                                                "email_max": {"$max": "$camp_email_count"},
                                                                "seed_avg": {"$avg": "$active_seed_count"},
                                                                "seed_min": {"$min": "$active_seed_count"},
                                                                "seed_max": {"$max": "$active_seed_count"},
                                                                "first_avg": {"$avg": "$first_attempt_inbox"},
                                                                "first_min": {"$min": "$first_attempt_inbox"},
                                                                "first_max": {"$max": "$first_attempt_inbox"},
                                                                "partial_avg": {"$avg": "$partial_inbox_ratio"},
                                                                "partial_min": {"$min": "$partial_inbox_ratio"},
                                                                "partial_max": {"$max": "$partial_inbox_ratio"}
                                                                },
                                                     }])
        keys_list = {'dom_avg': 'dom_counts', 'dom_max': 'dom_counts', 'dom_min': 'dom_counts',
                     'camp_avg': 'camp_trial_counts', 'camp_max': 'camp_trial_counts', 'camp_min': 'camp_trial_counts',
                     'seed_avg': 'active_seed_counts', 'seed_max': 'active_seed_counts',
                     'seed_min': 'active_seed_counts', 'first_avg': 'first_attempt_inbox',
                     'first_max': 'first_attempt_inbox', 'first_min': 'first_attempt_inbox',
                     'partial_avg': 'partial_inbox_ratio', 'partial_min': 'partial_inbox_ratio',
                     'partial_max': 'partial_inbox_ratio', 'email_min': 'camp_email_counts',
                     'email_avg': 'camp_email_counts', 'email_max': 'camp_email_counts'}
        current_time = today_date
        #print('-------------------------------------')
        #print(res)
        for row in res['result']:
            for tp in row:
                if tp == '_id':
                    continue
                tps = tp.split('_')
                form_insert_obj[keys_list[tp]][tps[1]] = round(row[tp], 2)
        gmail_res = self.mongo_db.gmail_data.aggregate([{"$match": {"time": {"$gte": current_time}}}, {"$group": {
            "_id": "$toEmail", "count": {"$sum": 1}}}, {"$group": {"_id": None, "avg": {"$avg": "$count"},
                                                                   "min": {"$min": "$count"},
                                                                   "max": {"$max": "$count"}}}])
        print("#######################################")
        print(type(gmail_res),gmail_res)
        if gmail_res:
            gmail_res = gmail_res['result'][0]
            form_insert_obj['deliver_email_counts'] = {'min': gmail_res['min'], 'max': gmail_res['max'],
                                                       'avg': gmail_res['avg']}
            print(form_insert_obj['deliver_email_counts'])
        c_res = self.mongo_db.gmail_data.aggregate([{"$match": {"time": {"$gte": current_time}, "status": 0}},
                                                         {"$group": {"_id": "$toEmail", "count": {"$sum": 1}}},
                                                         {"$group": {"_id": None, "avg": {"$avg": "$count"},
                                                                     "min": {"$min": "$count"},
                                                                     "max": {"$max": "$count"}}}])
        print(type(c_res),c_res)
        if c_res:
            c_res = c_res['result'][0]
            form_insert_obj['not_received_counts'] = {'min': c_res['min'], 'max': c_res['max'], 'avg': c_res['avg']}
        self.mongo_db.show_daily_counts.update({'_id': today_date}, {'$set': form_insert_obj}, upsert=True)

# obj = update_stats()
# obj.update_stats_in_db()
