# -*- coding: utf-8 -*-
import os
import sys
import json
from utilities import connections, template_validations, template_modifier, get_time, send_mail, send_test_mail
from utilities import get_schema, test, train
from utilities.logger import Logger
from thread import start_new_thread
from threading import current_thread
import time
import copy
import random
import string

logger = Logger(__name__).get_logger()


class predict:
    def __init__(self):
        path = "../../config/" + sys.argv[1]
        with open(os.path.join(path, 'config.json')) as data_file:
            data = json.load(data_file)
        con_obj = connections.connections()
        self.image_ratio = data['config']['img_ratio']
        self.text_ratio = data['config']['text_ratio']
        self.seed_count = data['config']['seed_list_limit']
        self.seed_test_count = data['config']['seed_list_limit_testing']
        self.seed_time = data['config']['seed_last_update_time']
        self.initial_sleep_time = data['config']['intial_sleep_time']
        self.general_sleep_time = data['config']['sleep_time']
        self.inbox_percentage = data['config']['inbox']
        self.less_avg_count = data['config']['less_avg_count']
        self.inbox_percentage_test = data['config']['inbox_test']
        self.con_obj = con_obj
        self.data = data
        self.mongo_db = con_obj.get_mongo_connection(data)
        self.redis_db = con_obj.get_redis_connection(data)
        self.rabbit_mq = con_obj.get_rabbitmq_connection(data)
        self.channel = None
        self.t_m_obj = template_modifier.template_modifier()
        self.t_v_obj = template_validations.validate()
        self.send_mail_url = data['rabbitmq']['sendMailUrl']
        self.send_report_url = data['rabbitmq']['sendReportUrl']
        self.spam_prom_keywords = self.get_spam_prom_keywords()

    def get_spam_prom_keywords(self):
        result = list(self.mongo_db.spam_prom_keywords.find({}))
        spam_prom_keys = []
        for row in result:
            spam_prom_keys.append(row['_id'])
        return spam_prom_keys

    @staticmethod
    def convert_to_string(msg):
        if isinstance(msg, str):
            msg = msg.decode('utf-8').encode('utf-8')
        else:
            msg = msg.encode('utf-8')
        return msg

    @staticmethod
    def wanted_keys_from_dict(dict_1, keys):
        ret_dict = {}
        for key in keys:
            ret_dict[key] = dict_1[key]
        return ret_dict

    @staticmethod
    def remove_sender_name(sender_names):
        if len(sender_names) > 1:
            sender_names.pop(0)

    @staticmethod
    def check_sender_name_change_is_need_or_not(response_res):
        change_required = True
        for row in response_res:
            if row['data']['type'] in ['inbox']:
                change_required = False
                break
        return change_required

    @staticmethod
    def remove_inbox_domains(response_data, domains):
        logger.info('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        logger.info(response_data)
        logger.info(domains)
        c = 0
        for row in response_data:
            for tp in row:
                if tp == 'inbox' or tp == 'failed':
                    for dmn in row[tp]:
                        if dmn in domains:
                            if tp == "inbox":
                                c += 1
                            domains.remove(dmn)
        return c

    @staticmethod
    def get_final_counts_dict(inbox_dmns, ttl_dmns):
        ret_dict = {'s_inbox': 0, 'p_inbox': 0, 'u_inbox': 0, 't_req': 1}
        if (ttl_dmns / 2) - (ttl_dmns / 4) <= inbox_dmns <= (ttl_dmns / 2) + (ttl_dmns / 4):
            ret_dict['p_inbox'] += 1
        elif inbox_dmns > (ttl_dmns / 4):
            ret_dict['s_inbox'] += 1
        elif inbox_dmns < (ttl_dmns / 4):
            ret_dict['u_inbox'] += 1
        return ret_dict

    @staticmethod
    def form_response_object_for_updation(response, total_domains_sent):
        ret_dict = {}
        ttl_dmns_copy = total_domains_sent[:]
        for key in response:
            temp_dict = []
            for dmn in response[key]:
                temp_dict.append({'dmn': dmn})
                ttl_dmns_copy.remove(dmn)
            ret_dict[key] = temp_dict
        if ttl_dmns_copy:
            for dmn in ttl_dmns_copy:
                if 'msgs_not_received' not in ret_dict:
                    ret_dict['msgs_not_received'] = [{'dmn': dmn}]
                else:
                    ret_dict['msgs_not_received'].append({'dmn': dmn})
        return ret_dict

    @staticmethod
    def get_avg_confidence(conf, domains, _id):
        ttl = len(domains)
        total_conf = {'inbox': 0.0, 'spam': 0.0}
        for dmn in domains:
            key = str(_id) + "." + str(dmn)
            for tp in conf[key]:
                total_conf[tp] += conf[key][tp]
        for tp in total_conf:
            total_conf[tp] /= ttl
        return total_conf

    @staticmethod
    def get_final_output(domain_result):
        keys_list = {}
        for dmn in domain_result:
            if '_id' not in domain_result[dmn]:
                key = '0.' + domain_result[dmn]['type']
            else:
                key = str(domain_result[dmn]['_id']) + "." + domain_result[dmn]['type']
            if key not in keys_list:
                keys_list[key] = [dmn]
            else:
                keys_list[key].append(dmn)
        final_output = []
        for key in keys_list:
            temp_key = key
            temp_key = temp_key.split('.')
            if temp_key[0] == '0':
                data = {'type': 'failed'}
            else:
                data = domain_result[keys_list[key][0]]
            dmns = keys_list[key]
            final_output.append({'data': data, temp_key[1]: dmns})
            del data
        return final_output

    @staticmethod
    def get_all_failed_messages(send_obj, gmail_emails_dict, failed_msgs, params):
        thread_name = params['thread_name']
        avg_mails_count = len(send_obj['emails']) / 2.0
        total_domains_dict = {}
        for dmn in send_obj['domains']:
            total_domains_dict[dmn] = send_obj['emails']
        redis_failed_messages = {}
        retry_domains = {}
        true_false_keys = {'false': False, 'true': True}
        for record in failed_msgs:
            if record['data']['domainId'] not in failed_msgs:
                redis_failed_messages[record['data']['domainId']] = [record['data']['email']]
                retry_domains[record['data']['domainId']] = true_false_keys[record['data']['retry']]
            else:
                redis_failed_messages[record['data']['domainId']].append(record['data']['email'])
        final_failed_messages = {}
        failed_dmns = {}
        for dmn, emails in total_domains_dict.items():
            if dmn in retry_domains and (not retry_domains[dmn]):
                if dmn in gmail_emails_dict:
                    temp_emails = list(set(emails) - set(gmail_emails_dict[dmn]))
                    if len(temp_emails) > avg_mails_count:
                        failed_dmns[dmn] = 'failed'
                else:
                    failed_dmns[dmn] = 'failed'
                continue
            if dmn in gmail_emails_dict:
                temp_emails = list(set(emails) - set(gmail_emails_dict[dmn]))
            else:
                temp_emails = emails[:]
            if dmn in redis_failed_messages:
                temp_emails = list(set(temp_emails + redis_failed_messages[dmn]))
            if len(temp_emails) < avg_mails_count:
                continue
            key = ""
            for email in temp_emails:
                key += "." + email
            if key not in final_failed_messages:
                final_failed_messages[key] = {}
                final_failed_messages[key]['domains'] = [dmn]
                final_failed_messages[key]['emails'] = temp_emails
            else:
                final_failed_messages[key]['domains'].append(dmn)
        ret_list = []
        for key in final_failed_messages:
            ret_list.append(final_failed_messages[key])
        logger.critical(thread_name + " failed messages and failed domains")
        del total_domains_dict, final_failed_messages
        logger.info("Retry_Domains:" + str(retry_domains))
        logger.info("Failed formatted messages")
        for row in ret_list:
            logger.info(str(row))
        logger.info("Failed Domains")
        for row in failed_dmns:
            logger.info(str(row))
        return {'failed_msgs': ret_list, 'failed_dmns': failed_dmns}

    @staticmethod
    def test_data(msg):
        test_obj = test.test_module()
        return test_obj.test_data(msg)

    @staticmethod
    def train_data(self):
        train.train_module(self.mongo_db)

    @staticmethod
    def get_spam_ham_decision(ret_res):
        inbox_spam_counts = {'ham': 0, 'spam': 0}
        for row in ret_res:
            if row['data']['type'] == "inbox":
                inbox_spam_counts['ham'] += len(row['inbox'])
            elif row['data']['type'] == "spam":
                inbox_spam_counts['spam'] += len(row['spam'])
        logger.info(str(inbox_spam_counts) + "---------------------------------------")
        if inbox_spam_counts['ham'] > inbox_spam_counts['spam']:
            return 'ham'
        elif inbox_spam_counts['spam'] > inbox_spam_counts['ham']:
            return 'spam'
        return 'failed'

    @staticmethod
    def decide_type_of_domains(types_data, inbox_precentage):
        return_response = {}
        confidence_res = {}
        for dmn in types_data:
            if types_data[dmn] == 'failed':
                return_response[dmn] = types_data[dmn]
                continue
            confidence = {'inbox': 0, 'spam': 0}
            types_count = {'inbox': 0, 'spam': 0}
            ttl = 0.0
            for tp in types_data[dmn]:
                if tp in ['inbox', 'updates']:
                    types_count['inbox'] += 1
                elif tp in ['promotions', 'spam']:
                    types_count['spam'] += 1
                ttl += 1
            for tp in confidence:
                confidence[tp] = round(types_count[tp] / ttl, 2)
            sort_reversly = sorted(types_count, key=types_count.get, reverse=True)
            if types_count[sort_reversly[0]] != types_count[sort_reversly[1]]:
                if sort_reversly[0] == "inbox":
                    if ((float(types_count[sort_reversly[0]]) / len(types_data[dmn])) * 100) >= inbox_precentage:
                        return_response[dmn] = sort_reversly[0]
                    else:
                        logger.info(str(dmn) + "=>" + str(types_data[dmn]) + "=>" + str(sort_reversly[0]) + "=>" + str(
                            types_count[sort_reversly[0]]))
                        del types_count[sort_reversly[0]]
                        sort_reversly.remove(sort_reversly[0])
                        if len(sort_reversly) > 1:
                            if types_count[sort_reversly[0]] != types_count[sort_reversly[1]]:
                                return_response[dmn] = sort_reversly[0]
                            else:
                                order_to_return = ['spam', 'inbox']
                                same_type = []
                                for tp in types_count:
                                    if types_count[tp] == types_count[sort_reversly[0]]:
                                        same_type.append(tp)
                                for tp in order_to_return:
                                    if tp in same_type:
                                        return_response[dmn] = tp
                                        break
                        else:
                            order_to_return = ['spam', 'inbox']
                            same_type = []
                            for tp in types_count:
                                if types_count[tp] == types_count[sort_reversly[0]]:
                                    same_type.append(tp)
                            for tp in order_to_return:
                                if tp in same_type:
                                    return_response[dmn] = tp
                                    break
                else:
                    return_response[dmn] = sort_reversly[0]
            else:
                order_to_return = ['spam', 'inbox']
                same_type = []
                for tp in types_count:
                    if types_count[tp] == types_count[sort_reversly[0]]:
                        same_type.append(tp)
                for tp in order_to_return:
                    if tp in same_type:
                        return_response[dmn] = tp
                        break
            confidence_res[dmn] = confidence
        form_response_dict = {}
        for dmn in return_response:
            if return_response[dmn] not in form_response_dict:
                form_response_dict[return_response[dmn]] = [dmn]
            else:
                form_response_dict[return_response[dmn]].append(dmn)
        del return_response
        return {'result': form_response_dict, 'confidence': confidence_res}

    @staticmethod
    def form_update_counts_object(modification_stats, spam_module_stats, delivery_stats):
        inc_obj = {}
        for change, value in modification_stats.items():
            if change == "o_spam":
                for change_name, dict_1 in value.items():
                    if change_name != "ttl":
                        for sub_dp, count in dict_1.items():
                            key = change + "." + change_name + "." + sub_dp
                            inc_obj[key] = count
                    else:
                        key = change + "." + change_name
                        inc_obj[key] = dict_1
            else:
                inc_obj[change] = value

        for dp, dict_1 in spam_module_stats.items():
            if dp == "ttl":
                key = "spam_module." + dp
                inc_obj[key] = dict_1
            else:
                for sub_dp, count in dict_1.items():
                    key = "spam_module." + dp + "." + sub_dp
                    inc_obj[key] = count
        for key, count in delivery_stats.items():
            key = "delivery_stats."+key
            inc_obj[key] = count
        return inc_obj

    def update_counts_in_db(self, daily_stats, prdon_date, params):
        inc_obj = self.form_update_counts_object(daily_stats, params['sm'], params['del_stats'])
        self.mongo_db.daily_stats_v2.update({'_id': prdon_date}, {'$inc': inc_obj}, upsert=True)
        self.mongo_db.overall_stats_v2.update({'_id': 1}, {'$inc': inc_obj}, upsert=True)
        del inc_obj

    def get_seed_list(self, query_field, current_time):
        emails_limit = self.seed_count
        query = {'updton': {'$gte': current_time}}
        if query_field:
            query['seedGroup'] = query_field
        else:
            query['seedGroup'] = {'$exists': False}
        result = list(self.mongo_db.seed_list.find(query).sort([('rotate', 1)]).limit(emails_limit))
        ids_list = []
        emails = []
        for row in result:
            ids_list.append(row['_id'])
            emails.append(row['email'])
        self.mongo_db.seed_list.update({'_id': {'$in': ids_list}}, {'$inc': {'rotate': 1}}, multi=True)
        emails_dict = {'emails': emails, 'test_seed': emails[:self.seed_test_count]}
        if len(emails) != emails_limit:
            emails_dict['status'] = False
        else:
            emails_dict['status'] = True
        return emails_dict

    def extract_domains(self, template):
        domains_dict = {}
        sender_ids_dict = {}
        for row in template['domains']:
            domains_dict[row['id']] = row['org_name']
            sender_ids_dict[row['id']] = row['senderId']
            find_obj = {'_id': row['id']}
            update_obj = {"$set": {'name': row['org_name'], 'senderId': row['senderId']}}
            self.mongo_db.domains_master.update(find_obj, update_obj, upsert=True)
        return {'domains': domains_dict, 'sender_ids': sender_ids_dict}

    def form_object_for_tests_insertion(self, template, from_change, test_id, params):
        insert_obj = self.wanted_keys_from_dict(template, ['tmpl', 'subject', 'senderName'])
        insert_obj['_id'] = test_id
        insert_obj['reqId'] = params['req_id']
        insert_obj['fromChange'] = from_change
        insert_obj['start_time'] = get_time.datetime_to_secs()
        insert_obj['sent'] = self.wanted_keys_from_dict(template, ['domains', 'cData'])
        return insert_obj

    def form_message_for_sending_mail(self, template, test_id, params, which_seed):
        send_message = self.wanted_keys_from_dict(template, ['tmpl', 'subject', 'senderName'])
        send_message['domains'] = template['sent']['domains']
        send_message['cData'] = template['sent']['cData']
        if which_seed == 'seed_list':
            send_message['emails'] = params['seed_list']
        else:
            send_message['emails'] = params['test_seed_list']
        send_message['headers'] = {"X-ReqIbr": str(test_id) + "_<DOMAINID>"}
        return send_message

    def validate_image_text(self, template):
        img_ratio_result = self.t_v_obj.validate_image_text_ratio(self.convert_to_string(template['tmpl']),
                                                                  self.image_ratio, self.text_ratio)
        if img_ratio_result:
            template['tmpl'] = self.t_m_obj.add_subject(template)

    def form_inbox_object_and_update(self, template, domains, conf, params):
        inbox_obj = self.wanted_keys_from_dict(template, ['subject', 'senderName'])
        inbox_obj['domains'] = domains
        tmp_count = params['tmp_count']
        params['tmp_count'] += 1
        inbox_obj['tmplId'] = tmp_count
        inbox_obj['res'] = 1
        inbox_obj['confidence'] = self.get_avg_confidence(conf, domains, template['_id'])
        key = "output.templates." + str(tmp_count)
        self.mongo_db.request_data.update({'_id': params['req_id']},
                                          {'$addToSet': {'output.report': inbox_obj}, '$set': {key: template['tmpl']}})
        del inbox_obj

    def form_final_output_format_of_spam_messages(self, ret_res_messages, from_where, params):
        thread_name = params['thread_name']
        final_output_format = {}
        p_list = ['inbox', 'spam']
        for row in ret_res_messages:
            for tp in row:
                if tp != 'data':
                    for dmn in row[tp]:
                        if dmn in final_output_format:
                            if p_list.index(row['data']['type']) <= p_list.index(final_output_format[dmn]['type']):
                                final_output_format[dmn] = row['data']
                        else:
                            final_output_format[dmn] = row['data']
        ret_res = self.get_final_output(final_output_format)
        logger.critical(thread_name + " " + from_where + " Final Output")
        for row in ret_res:
            logger.info(row['data']['type'] + "==>" + str(row[row['data']['type']]))
        del final_output_format
        return ret_res

    def form_train_data_object(self, template, respone_obj):
        _id = self.redis_db.incr('train_data')
        insert_object = {'type': respone_obj, 'time': get_time.datetime_to_secs(), '_id': _id,
                         'template': self.wanted_keys_from_dict(template, ['subject', 'senderName', 'tmpl', 'domains'])}
        return insert_object

    def update_inboxer_eds_stats(self, subject, domains, confidence, params):
        result = list(self.mongo_db.subject_master.find({'subject': subject}))
        today_date = int(get_time.iso_format(get_time.datetime.now()))
        if result:
            _id_key = result[0]['_id']
            self.mongo_db.subject_master.update({'_id': _id_key}, {'$set': {'date': today_date}})
        else:
            _id_key = self.redis_db.incr('subject_master')
            self.mongo_db.subject_master.insert({'_id': _id_key, 'subject': subject, 'date': today_date})
        for dmn in domains:
            inboxer_id = self.redis_db.incr('inboxer_eds_stats')
            if dmn in confidence:
                inboxer_inbox = round(confidence[dmn]['inbox'] * 100, 2)
            else:
                inboxer_inbox = 0
            insert_obj = {'_id': inboxer_id, 'subjId': _id_key, 'domain': params['domain_names'][dmn],
                          'inboxer_seed_count': self.seed_count, 'inboxer_inbox': inboxer_inbox, 'date': today_date,
                          'senderId': params['sender_ids'][dmn].strip(),
                          }
            self.mongo_db.inboxer_eds_stats.insert(insert_obj)

    def remove_less_avg_count_domains(self, response_result, emails_list):
        len_of_emails = len(emails_list)
        logger.info('---------------------------------------------')
        for dmn in response_result:
            logger.info(str(dmn) + "==>" + str(response_result[dmn]))
        logger.critical("emails not received more than avg in failed")
        remove_domains = []
        for dmn in response_result:
            if (len(response_result[dmn]) / float(len_of_emails)) * 100 < self.less_avg_count:
                logger.info(str(dmn))
                remove_domains.append(dmn)
        for dmn in remove_domains:
            del response_result[dmn]

    def form_object_for_request_data_insertion(self, template, _id):
        insert_obj = {
            '_id': _id,
            "input": self.wanted_keys_from_dict(template, ['subjects', 'senderNames', 'tmpl', 'domains']),
            "output": {
                "templates": {},
                "report": []
            },
            'cData': template['cData'],
            'start_time': get_time.datetime_to_secs(),
            "status": -1
        }
        if 'seedGroup' in template:
            insert_obj['input']['seedGroup'] = template['seedGroup']
        return insert_obj

    def update_in_request_data_final_output(self, final_result, params):
        res_2_obj = {}
        res_3_obj = {}
        for row in final_result:
            type_1 = row['data']['type']
            if type_1 == "inbox":
                continue
            if type_1 in ['failed', 'msgs_not_received']:
                if 'domains' not in res_3_obj:
                    res_3_obj['domains'] = row[type_1]
                    res_3_obj['res'] = 3
                else:
                    res_3_obj['domains'] += row[type_1]
            else:
                if 'domains' not in res_2_obj:
                    res_2_obj['domains'] = row[type_1]
                    res_2_obj['res'] = 2
                else:
                    res_2_obj['domains'] += row[type_1]
                if type_1 == 'spam':
                    _id_key = self.redis_db.incr('unable_to_inbox')
                    unable_to_inbox_obj = {'status': 0, 'time': get_time.datetime_to_secs(), '_id': _id_key,
                                           'template': self.wanted_keys_from_dict(row['data'],
                                                                                  ['subject', 'senderName', 'tmpl'])}
                    unable_to_inbox_obj['template']['domains'] = row[type_1]
                    self.mongo_db.unable_to_inbox.insert(unable_to_inbox_obj)
                    params['stats']['o_unable_to_inbox'] += 1
                    params['stats']['ttl'] += 1
                    del unable_to_inbox_obj
        if res_2_obj:
            self.mongo_db.request_data.update({'_id': params['req_id']}, {'$addToSet': {'output.report': res_2_obj}})
        if res_3_obj:
            self.mongo_db.request_data.update({'_id': params['req_id']}, {'$addToSet': {'output.report': res_3_obj}})
        del res_2_obj, res_3_obj

    def send_mail_and_return_failed_and_success_msgs(self, send_obj, params, seed_list=None, sleep_time=5):
        thread_name = params['thread_name']
        params['daily_counts']['camp_trial_count'] += 1
        if seed_list is None:
            seed_list_size = len(params['seed_list'])
        else:
            seed_list_size = len(seed_list)
        domains = send_obj['domains'][:]
        params['daily_counts']['camp_email_count'] += len(domains)
        logger.info(thread_name + " Domains sent:" + str(domains))
        test_id = int(send_obj['headers']['X-ReqIbr'].replace('_<DOMAINID>', ''))
        track_event = 'track_' + str(test_id)
        send_obj['trackEvent'] = track_event
        resp_code = send_test_mail.send_mail.send_message(send_obj, self.send_mail_url)

        if resp_code.status_code==333:
            logger.critical(thread_name + " *************manutal_testing_stop_code:*************" + str(resp_code.status_code))
            return {'stop':1}

        while resp_code.status_code != 200:
            logger.critical(thread_name + " *************Wrong_status_code:*************" + str(resp_code.status_code))
            time.sleep(60)
            resp_code = send_test_mail.send_mail.send_message(send_obj, self.send_mail_url)
            if resp_code.status_code==333:
                logger.critical(thread_name + " *************manutal_testing_stop_code:*************" + str(resp_code.status_code))
                return {'stop':1}

        logger.info(thread_name + " Message_send_code:" + str(resp_code.status_code))
        emails_length = len(domains) * seed_list_size
        max_iterate_count = int(sleep_time) * 20
        iterate_count = 0
        response_result = {}
        emails_dict = {}
        found_emails_count = 0
        redis_pub_sub = self.con_obj.get_redis_connection(self.data)
        sub = redis_pub_sub.pubsub()
        sub.subscribe(track_event)
        first = 0
        failed_msg_count = 0
        failed_msgs = []
        params['del_stats']['sent'] += emails_length
        while True:
            if (failed_msg_count + found_emails_count) >= emails_length:
                break
            check_in_db = list(self.mongo_db.gmail_data.find({"testId": test_id, "status": 0}))
            if check_in_db:
                _ids_list = []
                print_list = []
                for row in check_in_db:
                    found_emails_count += 1
                    print_list.append(str(row['domain']) + "==>" + row['toEmail'])
                    _ids_list.append(row['_id'])
                    if row['domain'] in response_result:
                        response_result[row['domain']].append(row['type'])
                    else:
                        response_result[row['domain']] = [row['type']]
                    if row['domain'] in emails_dict:
                        emails_dict[row['domain']].append(row['toEmail'])
                    else:
                        emails_dict[row['domain']] = [row['toEmail']]
                logger.info(thread_name + " extension return result:" + str(print_list))
                self.mongo_db.gmail_data.update({'_id': {'$in': _ids_list}}, {'$set': {'status': 1}}, multi=True)
                if found_emails_count >= emails_length:
                    break
            iterate_count += 1
            logger.info(str(thread_name) + " sleeping:" + str(iterate_count * 3) + "secs")
            c = 0
            while True:
                message = sub.get_message()
                if message:
                    if first == 0:
                        first += 1
                        continue
                    else:
                        data = json.loads(message['data'])
                        if data['data']['status'] in ['failed', 'defer']:
                            params['del_stats']['failed'] += 1
                            failed_msg_count += 1
                            if 'retry' not in data:
                                data['retry'] = 'false'
                            failed_msgs.append(data)
                            logger.info(thread_name + " redis failed messages" + str(data))
                        elif data['data']['status'] == "delivered":
                            params['del_stats']['delivered'] += 1
                time.sleep(1)
                c += 1
                if c == 3:
                    break
            if iterate_count >= max_iterate_count:
                break
        params['del_stats']['reached'] += found_emails_count
        redis_pub_sub.connection_pool.disconnect()
        final_failed_msgs = self.get_all_failed_messages(send_obj, emails_dict, failed_msgs, params)
        return {'success': response_result, 'failure': final_failed_msgs['failed_msgs'], 'emails': emails_dict,
                'failed_dmns': final_failed_msgs['failed_dmns']}

    def send_mail_and_decide_type(self, send_obj, params, which_seed, sleep_time=5):
        thread_name = params['thread_name']
        if which_seed == 'seed_list':
            ret_res = self.send_mail_and_return_failed_and_success_msgs(send_obj, params, None, sleep_time)
        else:
            ret_res = self.send_mail_and_return_failed_and_success_msgs(send_obj, params, params['test_seed_list'],
                                                                        sleep_time)

        #stopping when manual test
        if 'stop' in ret_res:
            return {'stop':1}

        emails_list = send_obj['emails']
        failed_msgs = ret_res['failure']
        failed_dmns = ret_res['failed_dmns']
        response_result = ret_res['success']
        logger.critical(thread_name + " success messages")
        for row in response_result:
            logger.info(str(row) + "===>" + str(response_result[row]))
        logger.info("failed messages")
        for row in failed_msgs:
            logger.info(str(row))

        for dmn in failed_dmns:
            if dmn not in response_result:
                response_result[dmn] = 'failed'
        self.remove_less_avg_count_domains(response_result, emails_list)
        if which_seed == 'seed_list':
            return self.decide_type_of_domains(response_result, self.inbox_percentage)
        else:
            return self.decide_type_of_domains(response_result, self.inbox_percentage_test)

    def test_mail_return_type(self, template, from_change, params, conf, which_seed, sleep_time):
        thread_name = params['thread_name']
        test_id = self.redis_db.incr('tests')
        insert_obj = self.form_object_for_tests_insertion(template, from_change, test_id, params)
        self.mongo_db.tests.insert(insert_obj)
        send_message = self.form_message_for_sending_mail(insert_obj, test_id, params, which_seed)
        logger.info(thread_name + " " + from_change + " started")
        ret_res = self.send_mail_and_decide_type(send_message, params, which_seed, sleep_time)

        if 'stop' in ret_res:
            return {'stop':1}


        ret_types_result = ret_res['result']
        conf_res = ret_res['confidence']
        for dmn in conf_res:
            key = str(insert_obj['_id']) + "." + str(dmn)
            conf[key] = conf_res[dmn]
        logger.info(thread_name + "=>" + from_change + "=>" + str(ret_types_result))
        response_object = self.form_response_object_for_updation(ret_types_result, template['domains'])
        end_time = get_time.datetime_to_secs()
        self.mongo_db.tests.update({'_id': test_id}, {'$set': {'resp': response_object, 'end_time': end_time}})
        train_data_object = self.form_train_data_object(template, response_object)
        msgs_not_received = None
        if 'msgs_not_received' in response_object:
            msgs_not_received = response_object['msgs_not_received']
        self.mongo_db.train_data.insert(train_data_object)
        del send_message, response_object, train_data_object
        return {'ret_res': ret_res, 'insert_obj': insert_obj, 'msgs_not_received': msgs_not_received}

    def which_part_is_problem_for_spam(self, template, domains, conf, params, sleep_time):
        new_template = copy.deepcopy(template)
        new_template['domains'] = domains
        new_template['subject'] = ''.join([random.choice(string.ascii_lowercase) for n in xrange(random.randint(4, 6))])
        random_sender_name = ''.join([random.choice(string.ascii_lowercase) for n in xrange(random.randint(4, 6))])
        new_template['senderName'] = random_sender_name
        which_part = {}
        ret_res = self.test_mail_return_type(new_template, 'Original_template', params, conf, 'test_seed', sleep_time)

        if 'stop' in ret_res:
            return {'stop':1}

        ret_types_result = ret_res['ret_res']['result']
        for tp in ret_types_result:
            if tp == "spam":
                which_part['template'] = ret_types_result[tp]
                for dmn in ret_types_result[tp]:
                    if dmn in new_template['domains']:
                        new_template['domains'].remove(dmn)
            elif tp == "inbox":
                new_template['domains'] = ret_types_result[tp]
                new_template['senderName'] = template['senderName']
                new_subj = ''.join([random.choice(string.ascii_lowercase) for n in xrange(random.randint(4, 6))])
                new_template['subject'] = new_subj
                res = self.test_mail_return_type(new_template, 'Original_sender_template', params, conf, 'test_seed',
                                                 sleep_time)
                if 'stop' in res:
                    return {'stop':1}

                ret_res_types = res['ret_res']['result']
                for tps in ret_res_types:
                    if tps == 'inbox':
                        which_part['subject'] = ret_res_types[tps]
                    else:
                        which_part['senderName'] = ret_res_types[tps]
        return which_part

    def test_change(self, template, change, change_names, domains, sm_dec, conf, params, sleep_time, details, all_dmns):
        from_change = "Original:" + details['which'] + ":" + sm_dec + ":" + change_names[change]
        res = self.test_mail_return_type(template, from_change, params, conf, 'seed_list', sleep_time)

        if 'stop' in res:
            return {'stop':1}

        insert_obj = res['insert_obj']
        msgs_not_received = res['msgs_not_received']
        if msgs_not_received:
            for row in msgs_not_received:
                dmn = row['dmn']
                if dmn in all_dmns:
                    logger.info(params['thread_name'] + "----------------msgs_not_recvd-------------" + str(dmn))
                    all_dmns.remove(dmn)
        new_template = self.wanted_keys_from_dict(insert_obj, ['_id', 'tmpl', 'subject', 'senderName'])
        new_template['cData'] = insert_obj['sent']['cData']
        new_template['domains'] = domains[:]
        ret_types_res = res['ret_res']['result']
        conf_res = res['ret_res']['confidence']
        temp_change_res = []
        for tp in ret_types_res:
            new_template['type'] = tp
            if tp == "inbox":
                params['stats']['o_spam'][change_names[change]]['ham'] += 1
                params['stats']['o_spam'][change_names[change]]['ttl'] += 1
                self.update_inboxer_eds_stats(new_template['subject'], ret_types_res[tp], conf_res, params)
                tmp_copy = new_template.copy()
                del tmp_copy['domains']
                temp_change_res.append({'data': tmp_copy, 'inbox': ret_types_res[tp]})
                self.form_inbox_object_and_update(tmp_copy, ret_types_res[tp], conf, params)
                del tmp_copy
                for dmn in ret_types_res[tp]:
                    if dmn in domains:
                        domains.remove(dmn)
                    if dmn in all_dmns:
                        all_dmns.remove(dmn)
            elif tp == 'failed':
                temp_change_res.append({'data': {'type': 'failed'}, 'failed': ret_types_res[tp]})
                for dmn in ret_types_res[tp]:
                    if dmn in domains:
                        domains.remove(dmn)
                    if dmn in all_dmns:
                        all_dmns.remove(dmn)
            else:
                params['stats']['o_spam'][change_names[change]]['spam'] += 1
                params['stats']['o_spam'][change_names[change]]['ttl'] += 1
                tmp_copy = new_template.copy()
                del tmp_copy['domains']
                temp_change_res.append({'data': tmp_copy, 'spam': ret_types_res[tp]})
                del tmp_copy
        logger.critical(params['thread_name'] + " " + from_change + " Final Result:")
        for row in temp_change_res:
            logger.info(row['data']['type'] + "==>" + str(row[row['data']['type']]))
        stats_obj = {'template': template, 'domains': domains, 'conf_res': conf_res}
        del new_template, insert_obj, ret_types_res
        return {'result': temp_change_res, 'stats_obj': stats_obj}

    def modify_all_check_spam(self, org_template, all_dmns, params, conf, sleep_time):
        thread_name = params['thread_name']
        find_count = 0
        temp_res = self.t_m_obj.modify_prom_spam(org_template['tmpl'], thread_name, self.spam_prom_keywords)
        if temp_res['found']:
            find_count += 1
        org_template['tmpl'] = temp_res['content']
        temp_res = self.t_m_obj.modify_prom_spam(org_template['subject'], thread_name, self.spam_prom_keywords)
        if temp_res['found']:
            find_count += 1
        org_template['subject'] = temp_res['content']
        temp_res = self.t_m_obj.modify_prom_spam(org_template['senderName'], thread_name, self.spam_prom_keywords)
        if temp_res['found']:
            find_count += 1
        org_template['senderName'] = temp_res['content']
        if find_count >= 2:
            params['sm']['ttl'] += 1
            if self.test_data(org_template['subject'] + org_template['tmpl']) == 0:
                sm_dec = "ham"
            else:
                sm_dec = "spam"
            change_names = {1: 'all_p_s'}
            dt = {'which': 'tmpl_subj_send'}
            res = self.test_change(org_template, 1, change_names, all_dmns, sm_dec, conf, params, sleep_time, dt,
                                   all_dmns)

            if 'stop' in res:
                return {'stop':1}

            ret_res_messages = res['result']
            spam_ham = self.get_spam_ham_decision(ret_res_messages)
            logger.info(thread_name + "==>spam_ham_dec:" + spam_ham)
            params['sm'][sm_dec]['ttl'] += 1
            params['sm'][sm_dec][spam_ham] += 1
            stats_obj = res['stats_obj']
            send_key = 'modify_all'
            res = self.form_final_output_format_of_spam_messages(ret_res_messages, send_key, params)
            return {'res': res, 'stats_obj': stats_obj}
        else:
            return None

    def test_changes_return(self, template, domains, conf, params, sl_tm, details, all_dmns):
        logger.info('------------------------problem-------------------------')
        logger.critical(params['thread_name'] + "==>" + str(details))
        logger.info('-------------------------------------------------------')
        changes_list = details['changes_list']
        change_names = details['changes_names']
        thread_name = params['thread_name']
        domain_result = {}
        for dmn in domains:
            domain_result[dmn] = template.copy()
        ret_res_messages = []
        sm_spam_messages = {}
        stats_obj = None
        for change in changes_list:
            # change = random.sample(changes_list.keys(), 1)[0]
            temp_template = template.copy()
            temp_template['tmpl'] = self.convert_to_string(temp_template['tmpl'])
            temp_template['subject'] = self.convert_to_string(temp_template['subject'])
            if details['which'] == 'subject':
                if change_names[change] == "sb_d_a":
                    temp_template['subject'] = changes_list[change](temp_template['subject'], thread_name)
                else:
                    temp_res = changes_list[change](temp_template['subject'], thread_name, self.spam_prom_keywords)
                    if temp_res['found']:
                        find_keys = temp_res['find_keys']
                        self.mongo_db.spam_prom_keywords.update({"_id": {"$in": find_keys}}, {"$inc": {"count": 1}},
                                                                multi=True)
                        temp_template['subject'] = temp_res['content']
                    else:
                        logger.info(thread_name + "------>No spam prom keywords in subject------------------")
                        # del changes_list[change]
                        continue
            elif details['which'] == 'senderName':
                if change_names[change] == "s_p_s":
                    temp_res = changes_list[change](temp_template['senderName'], thread_name, self.spam_prom_keywords)
                    if temp_res['found']:
                        temp_template['senderName'] = temp_res['content']
                        find_keys = temp_res['find_keys']
                        self.mongo_db.spam_prom_keywords.update({"_id": {"$in": find_keys}}, {"$inc": {"count": 1}},
                                                                multi=True)
                    else:
                        logger.info(thread_name + "------>No spam prom keywords in senderName------------------")
                        # del changes_list[change]
                        continue
                else:
                    ret_sender_name = changes_list[change](temp_template['senderName'], thread_name)
                    if ret_sender_name != temp_template['senderName']:
                        template['senderName'] = ret_sender_name
                    else:
                        continue
            elif details['which'] == 'tmpl':
                if change_names[change] == "t_p_s":
                    temp_res = changes_list[change](temp_template['tmpl'], thread_name, self.spam_prom_keywords)
                    if temp_res['found']:
                        temp_template['tmpl'] = temp_res['content']
                        find_keys = temp_res['find_keys']
                        self.mongo_db.spam_prom_keywords.update({"_id": {"$in": find_keys}}, {"$inc": {"count": 1}},
                                                                multi=True)
                    else:
                        logger.info(thread_name + "------>No spam prom keywords in template------------------")
                        # del changes_list[change]
                        continue
                else:
                    temp_template['tmpl'] = changes_list[change](temp_template['tmpl'], thread_name)

            if self.test_data(temp_template['subject'] + temp_template['tmpl']) == 0:
                temp_template['domains'] = domains[:]
                ret_resl = self.test_change(temp_template, change, change_names, domains, 'sm_ham', conf, params, sl_tm,
                                            details, all_dmns)

                if 'stop' in ret_resl:
                    return {'stop':1}

                ret_res_messages += ret_resl['result']
                stats_obj = ret_resl['stats_obj']
                spam_ham = self.get_spam_ham_decision(ret_resl['result'])
                logger.info(thread_name + "==>spam_ham_dec:" + spam_ham)
                params['sm']['ttl'] += 1
                params['sm']['ham']['ttl'] += 1
                params['sm']['ham'][spam_ham] += 1
            else:
                sm_spam_messages[change] = temp_template
            # del changes_list[change]
            if not domains:
                break
        if sm_spam_messages and domains:
            for ch in sm_spam_messages:
                sm_spam_messages[ch]['domains'] = domains[:]
                temp = sm_spam_messages[ch]
                ret_resl = self.test_change(temp, ch, change_names, domains, 'sm_spam', conf, params, sl_tm, details,
                                            all_dmns)

                if 'stop' in ret_resl:
                    return {'stop':1}


                ret_res_messages += ret_resl['result']
                stats_obj = ret_resl['stats_obj']
                spam_ham = self.get_spam_ham_decision(ret_resl['result'])
                logger.info(thread_name + "==>spam_ham_dec:" + spam_ham)
                params['sm']['ttl'] += 1
                params['sm']['spam']['ttl'] += 1
                params['sm']['spam'][spam_ham] += 1
                if not domains:
                    break
        del domain_result, sm_spam_messages
        send_key = 'test_changes' + details['which']
        res = self.form_final_output_format_of_spam_messages(ret_res_messages, send_key, params)
        return {'res': res, 'stats_obj': stats_obj}

    def subject_result(self, template, conf, params, sleep_time, first=0):
        org_template = copy.deepcopy(template)
        all_dmns = template['domains'][:]
        ret_result = self.test_mail_return_type(template, 'Original', params, conf, 'seed_list', sleep_time)

        if 'stop' in ret_result:
            return {'stop':1}

        msgs_not_received = ret_result['msgs_not_received']
        if msgs_not_received:
            for row in msgs_not_received:
                dmn = row['dmn']
                if dmn in all_dmns:
                    logger.info(params['thread_name'] + "----------------msgs_not_recvd-------------" + str(dmn))
                    all_dmns.remove(dmn)
        sleep_time = self.general_sleep_time
        ret_res = ret_result['ret_res']
        insert_obj = ret_result['insert_obj']
        new_template = self.wanted_keys_from_dict(insert_obj, ['_id', 'tmpl', 'subject', 'senderName'])
        new_template['cData'] = insert_obj['sent']['cData']
        final_result_subj = []
        ret_types_result = ret_res['result']
        conf_res = ret_res['confidence']
        stats_obj = None
        for tp in ret_types_result:
            dom = ret_types_result[tp][:]
            new_template['type'] = tp
            if tp == 'inbox':
                params['stats']['o_ham'] += 1
                params['stats']['ttl'] += 1
                inbox_domains = len(ret_types_result[tp])
                if first:
                    ttl_dom = len(template['domains'])
                    params['daily_counts']['first_attempt_inbox'] = (inbox_domains / float(ttl_dom)) * 100
                tmp_copy = new_template.copy()
                self.update_inboxer_eds_stats(template['subject'], ret_types_result[tp], conf_res, params)
                final_result_subj.append({'data': tmp_copy, 'inbox': ret_types_result[tp]})
                self.form_inbox_object_and_update(tmp_copy, ret_types_result[tp], conf, params)
                for dmn in ret_types_result[tp]:
                    if dmn in all_dmns:
                        all_dmns.remove(dmn)
                del tmp_copy
            elif tp == 'failed':
                for dmn in ret_types_result[tp]:
                    if dmn in all_dmns:
                        all_dmns.remove(dmn)
                final_result_subj.append({'data': {'type': 'failed'}, 'failed': ret_types_result[tp]})
            else:
                params['stats']['o_spam']['ttl'] += 1
                params['stats']['ttl'] += 1
                problem_part = self.which_part_is_problem_for_spam(new_template.copy(), dom, conf, params, sleep_time)

                if 'stop' in problem_part:
                    return {'stop':1}

                for problem in problem_part:
                    domns = problem_part[problem]
                    if problem == "template":
                        dt = {
                            'changes_list': {1: self.t_m_obj.modify_prom_spam,
                                             2: self.t_m_obj.div_tag_adding_in_middle}, 'which': 'tmpl',
                            'changes_names': {1: 't_p_s', 2: 't_d_c'}, 'no_of_changes': 2
                        }
                        rs = self.test_changes_return(template, domns, conf, params, sleep_time, dt, all_dmns)

                        if 'stop' in rs:
                            return {'stop':1}

                        final_result_subj += rs['res']
                        stats_obj = rs['stats_obj']
                    elif problem == "senderName":
                        dt = {
                            'changes_list': {1: self.t_m_obj.modify_prom_spam, 2: self.t_m_obj.modify_sender_name},
                            'changes_names': {1: 's_p_s', 2: 's_n_c'},
                            'which': 'senderName', 'no_of_changes': 2
                        }
                        rs = self.test_changes_return(template, domns, conf, params, sleep_time, dt, all_dmns)

                        if 'stop' in rs:
                            return {'stop':1}

                        final_result_subj += rs['res']
                        stats_obj = rs['stats_obj']
                    elif problem == "subject":
                        dt = {
                            'changes_list': {1: self.t_m_obj.modify_prom_spam, 2: self.t_m_obj.subject_changes},
                            'changes_names': {2: 'sb_d_a', 1: 'sb_ps'}, 'which': 'subject', 'no_of_changes': 2
                        }
                        rs = self.test_changes_return(template, domns, conf, params, sleep_time, dt, all_dmns)

                        if 'stop' in rs:
                            return {'stop':1}

                        final_result_subj += rs['res']
                        stats_obj = rs['stats_obj']
        if all_dmns:
            org_template['domains'] = all_dmns
            res = self.modify_all_check_spam(org_template, all_dmns, params, conf, sleep_time)

            if res is not None and 'stop' in res:
                return {'stop':1}

            if res:
                final_result_subj += res['res']
                stats_obj = res['stats_obj']
        if stats_obj:
            self.update_inboxer_eds_stats(stats_obj['template']['subject'], stats_obj['domains'], stats_obj['conf_res'],
                                          params)
        sub_res = self.form_final_output_format_of_spam_messages(final_result_subj, 'subject_module', params)
        logger.critical(params['thread_name'] + " " + template['subject'] + " Result")
        for row in sub_res:
            logger.info(row['data']['type'] + "==>" + str(row[row['data']['type']]))
        del insert_obj, ret_types_result, new_template, final_result_subj
        return sub_res

    def start_process(self, template, method):
        _id_key = self.redis_db.incr('request_data')
        thread_name = current_thread().getName().replace("Dummy", "Thread") + " and Request_id is:" + str(_id_key)
        self.validate_image_text(template)
        self.t_v_obj.validate_html_code(template['tmpl'], self.mongo_db, self.redis_db)
        logger.info(thread_name + " started")
        domains_dict = self.extract_domains(template)
        domains = domains_dict['domains'].keys()
        insert_obj = self.form_object_for_request_data_insertion(template, _id_key)
        self.mongo_db.request_data.insert(insert_obj)
        if len(domains)<=0:
            self.mongo_db.request_data.update({'_id': _id_key}, {'$set': {'status': 1, 'end_time': get_time.datetime_to_secs()}})
            self.channel.basic_ack(method.delivery_tag)
            del insert_obj
            return

        query_field = None
        if 'seedGroup' in template:
            query_field = template['seedGroup']
        current_time = get_time.datetime_to_secs() - self.seed_time
        seed_list = self.get_seed_list(query_field, current_time)
        today_date = int(get_time.iso_format(get_time.datetime.now()))
        show_daily_counts = {'less_number_seeds': 0}
        if query_field:
            query = {'updton': {'$gte': current_time}, 'seedGroup': query_field}
        else:
            query = {'updton': {'$gte': current_time}}
        active_seed_list_count = self.mongo_db.seed_list.find(query).count(True)
        if not seed_list['status']:
            seed_group = template['seedGroup'] + "_seed"
            mail_sent_status = self.redis_db.get(seed_group)
            if not mail_sent_status:
                self.redis_db.set(seed_group, 'mail_sent', ex=1800)
                try:
                    send_mail.inactive_seed_send_mail(self.mongo_db, template['seedGroup'], current_time)
                except Exception as e:
                    logger.info(thread_name + " =>exception occured at sending seed group inactive mail" + str(e))
            show_daily_counts['less_number_seeds'] += 1
            send_res = {'status': -1, 'cData': template['cData'], 'domains': domains}
            resp_status = send_test_mail.send_mail.send_report(send_res, self.send_report_url, True)
            end_time = get_time.datetime_to_secs()
            logger.info(thread_name + " Final output send status when seed list is not there:" + str(resp_status))
            if resp_status.status_code == 200:
                self.mongo_db.request_data.update({'_id': _id_key}, {'$set': {'status': -2, 'end_time': end_time}})
            else:
                self.mongo_db.request_data.update({'_id': _id_key}, {'$set': {'status': -20, 'end_time': end_time}})
            self.channel.basic_ack(method.delivery_tag)
            daily_count_obj = {'_id': _id_key, 'active_seed_count': active_seed_list_count, 'date': today_date}
            self.mongo_db.daily_counts.insert(daily_count_obj)
        else:
            ttl_dom_len = len(domains)
            sender_names = template['senderNames'][:]
            final_result = []
            conf = {}
            params = {'thread_name': thread_name, 'tmp_count': 1, 'req_id': _id_key, 'seed_list': seed_list['emails'],
                      'test_seed_list': seed_list['test_seed'], 'sender_ids': domains_dict['sender_ids'],
                      'domain_names': domains_dict['domains'],
                      'daily_counts': {'_id': _id_key, 'dom_count': ttl_dom_len, 'camp_trial_count': 0,
                                       'active_seed_count': active_seed_list_count, 'partial_inbox_ratio': 0,
                                       'camp_email_count': 0, 'first_attempt_inbox': 0},
                      'stats': get_schema.get_daily_stats(), 'sm': get_schema.get_sm_schema(),
                      'del_stats': {'sent': 0, 'reached': 0, 'delivered': 0, 'failed': 0}
                      }
            params['stats']['r_ttl'] += 1
            first = 0
            for subj in template['subjects']:
                temp_template = {'subject': self.convert_to_string(subj), 'senderName': sender_names[0],
                                 'domains': domains, 'tmpl': self.convert_to_string(template['tmpl']),
                                 'cData': template['cData']}
                logger.info(thread_name + " " + subj + " " + sender_names[0] + " started")
                if first == 0:
                    first += 1
                    response_res = self.subject_result(temp_template, conf, params, self.initial_sleep_time, first)
                else:
                    response_res = self.subject_result(temp_template, conf, params, self.general_sleep_time)

                if 'stop' in response_res:
                    end_time = get_time.datetime_to_secs()
                    self.mongo_db.request_data.update({'_id': _id_key}, {'$set': {'status': 333, 'end_time': end_time}})
                    self.channel.basic_ack(method.delivery_tag)
                    return


                change_sender_name_status = self.check_sender_name_change_is_need_or_not(response_res)
                if change_sender_name_status:
                    logger.info(thread_name + " All mails are spam changing senderName")
                    self.remove_sender_name(sender_names)
                self.remove_inbox_domains(response_res, domains)
                final_result += response_res
                if not domains:
                    break
                del response_res
                logger.warning('---------------------------one subject completed--------------------------------')
            logger.critical(thread_name + " All subject messages")
            for row in final_result:
                logger.info(row['data']['type'] + "==>" + str(row[row['data']['type']]))
            send_final_result = self.form_final_output_format_of_spam_messages(final_result, 'final_output', params)
            domains_got_res = []
            for row in send_final_result:
                tp_1 = row['data']['type']
                domains_got_res += row[tp_1]
            msgs_not_recvd_dict = {}
            for dmn in domains:
                if dmn not in domains_got_res:
                    if 'msgs_not_received' not in msgs_not_recvd_dict:
                        msgs_not_recvd_dict['data'] = {'type': 'msgs_not_received'}
                        msgs_not_recvd_dict['msgs_not_received'] = [dmn]
                    else:
                        msgs_not_recvd_dict['msgs_not_received'].append(dmn)
            if msgs_not_recvd_dict:
                send_final_result.append(msgs_not_recvd_dict)
            ttl_inbox_dmns = 0
            for row in send_final_result:
                if 'inbox' in row:
                    ttl_inbox_dmns += len(row['inbox'])
            inc_dict = self.get_final_counts_dict(ttl_inbox_dmns, len(domains))
            params['daily_counts']['date'] = today_date
            self.mongo_db.inboxer_stats.update({'_id': today_date}, {'$inc': inc_dict}, upsert=True)
            self.update_in_request_data_final_output(send_final_result, params)
            send_res = list(self.mongo_db.request_data.find({'_id': _id_key}, {'output': 1, 'cData': 1}))
            inbox_domains_count = 0
            for row in send_res[0]['output']['report']:
                if row['res'] == 1:
                    inbox_domains_count += len(row['domains'])
            show_daily_counts['ttl_campaigns'] = 1
            if inbox_domains_count == ttl_dom_len:
                show_daily_counts['successfully_inbox'] = 1
            else:
                show_daily_counts['partially_inbox'] = 1
            params['daily_counts']['partial_inbox_ratio'] = round((inbox_domains_count / (float(ttl_dom_len)) * 100), 2)
            self.mongo_db.daily_counts.insert(params['daily_counts'])
            self.update_counts_in_db(params['stats'], today_date, params)
            resp_status = send_test_mail.send_mail.send_report(send_res[0], self.send_report_url)
            logger.info('way2target report...................................')
            logger.info(send_res[0])
            logger.info(thread_name + " Final output send status:" + str(resp_status))
            end_time = get_time.datetime_to_secs()
            if resp_status.status_code == 200:
                self.mongo_db.request_data.update({'_id': _id_key}, {'$set': {'status': 1, 'end_time': end_time}})
            else:
                self.mongo_db.request_data.update({'_id': _id_key}, {'$set': {'status': -10, 'end_time': end_time}})
            self.channel.basic_ack(method.delivery_tag)
            del insert_obj, send_final_result

    def process_one_request(self, ch, method, properties, body):
        logger.info("Got request starting a thread.....")
        start_new_thread(self.start_process, (json.loads(body), method,))
        logger.info(str(ch) + "==>" + str(properties))

    def get_data_from_rabbit_mq(self):
        self.channel = self.rabbit_mq.channel()
        self.channel.queue_declare(queue=self.data['rabbitmq']['db'], durable=True)
        self.channel.basic_consume(self.process_one_request, queue=self.data['rabbitmq']['db'], no_ack=False)
        self.channel.start_consuming()


obj = predict()
obj.get_data_from_rabbit_mq()
