from collections import Counter
from nltk.corpus import stopwords
import numpy as np
from sklearn.externals import joblib
from sklearn.svm import LinearSVC
import get_time
import json

stop = set(stopwords.words('english'))


class train_module:
    def __init__(self, db):
        self.svm_output_file_name = "svm.pkl"
        size = 50000
        n_days = 30
        self.word_count = 3000
        present_time = get_time.datetime_to_secs()
        from_time = present_time - (n_days * 86400)
        query = {"$or": [{"type.inbox": {"$exists": True}}, {"type.promotions": {"$exists": True}},
                         {"type.updates": {"$exists": True}}], "time": {"$gte": from_time}}
        ham_data = list(db.train_data.find(query).limit(size))
        spam_data = list(db.train_data.find({"time": {"$gte": from_time}, "type.spam": {"$exists": True}}))
        result = self.get_train_data(ham_data, spam_data, size)
        self.train_data = result['data']
        self.train_size = result['size']
        self.most_common_words_dict = self.make_dictionary(self.train_data, self.word_count)
        m_c_w = open('most_common_words.txt', "w+")
        m_c_w.write(json.dumps(self.most_common_words_dict))
        m_c_w.close()
        self.train_matrix = None
        self.train_labels = None
        self.svm = None
        self.train_extract_features()
        self.train_model_svm()
        self.save_module_svm()

    @staticmethod
    def get_formatted_data(data, spam_count, ham_count, size, train_data):
        for row in data:
            if 'template' in row and 'tmpl' in row['template'] and 'subject' in row['template'] and 'type' in row:
                template = {'template': {'body': row['template']['tmpl'], 'subj': row['template']['subject']}}
                for type_1 in row['type']:
                    temp_template = template.copy()
                    if type_1 in ['promotions', 'updates', 'inbox'] and ham_count < size:
                        temp_template['type'] = 'inbox'
                        if temp_template not in train_data:
                            ham_count += 1
                            train_data.append(temp_template)
                    elif type_1 == 'spam' and spam_count < size:
                        temp_template['type'] = 'spam'
                        if temp_template not in train_data:
                            spam_count += 1
                            train_data.append(temp_template)
                    del temp_template
            if spam_count >= size and ham_count >= size:
                break
        return {'spam_count': spam_count, 'ham_count': ham_count, 'data': train_data}

    def get_train_data(self, ham_data, spam_data, size):
        train_data = []
        ret_spam_data = self.get_formatted_data(spam_data, 0, 0, size, [])
        train_data += ret_spam_data['data']
        spam_count = ret_spam_data['spam_count']
        ham_count = ret_spam_data['ham_count']
        ret_ham_data = self.get_formatted_data(ham_data, spam_count, ham_count, size, train_data)
        train_data += ret_ham_data['data']
        return {'data': train_data, 'size': len(train_data)}

    @staticmethod
    def make_dictionary(train_data, word_count):
        all_words = []
        for row in train_data:
            if 'template' in row and 'subj' in row['template'] and row['template']['subj'] is not None:
                row['template']['subj'] = row['template']['subj'].lower()
                all_words += row['template']['subj'].split()
            if 'template' in row and 'body' in row['template'] and row['template']['body'] is not None:
                row['template']['body'] = row['template']['body'].lower()
                if row['template']['body'].find('http://') or row['template']['body'].find('https://'):
                    split_res = row['template']['body'].split()
                    new_list = []
                    for rec in split_res:
                        if rec.find('http://') != -1:
                            insert_rec = rec[:rec.find('/', 7)]
                            new_list.append(insert_rec)
                            del split_res[split_res.index(rec)]
                        elif rec.find('https://') != -1:
                            insert_rec = rec[:rec.find('/', 8)]
                            new_list.append(insert_rec)
                            del split_res[split_res.index(rec)]
                    split_res += new_list
                    all_words += split_res
                else:
                    all_words += row['template']['body'].split()
        dictionary = Counter(all_words)
        list_to_remove = dictionary.keys()
        for item in list_to_remove:
            if item in stop:
                del dictionary[item]
            elif len(item) == 1:
                del dictionary[item]
        dictionary = dictionary.most_common(word_count)
        dict_1 = {}
        for row in dictionary:
            dict_1[row[0]] = row[1]
        return dict_1

    @staticmethod
    def extract_features(data, dictionary, n, word_count):
        features_matrix = np.zeros((len(data), word_count))
        doc_id = 0
        labels = np.zeros(n)
        for row in data:
            all_words = []
            if row['type'] == "spam":
                labels[doc_id] = 1
            if 'template' in row and 'subj' in row['template'] and row['template']['subj'] is not None:
                all_words += row['template']['subj'].split()
            if 'template' in row and 'body' in row['template'] and row['template']['body'] is not None:
                row['template']['body'] = row['template']['body'].lower()
                if row['template']['body'].find('http://') or row['template']['body'].find('https://'):
                    split_res = row['template']['body'].split()
                    new_list = []
                    for rec in split_res:
                        if rec.find('http://') != -1:
                            insert_rec = rec[:rec.find('/', 7)]
                            new_list.append(insert_rec)
                            del split_res[split_res.index(rec)]
                        elif rec.find('https://') != -1:
                            insert_rec = rec[:rec.find('/', 8)]
                            new_list.append(insert_rec)
                            del split_res[split_res.index(rec)]
                    split_res += new_list
                    all_words += split_res
                else:
                    all_words += row['template']['body'].split()
            for word in set(all_words):
                if word in dictionary:
                    word_id = dictionary.keys().index(word)
                    features_matrix[doc_id, word_id] = all_words.count(word)
            doc_id += 1
        return {'features': features_matrix, 'labels': labels}

    def train_extract_features(self):
        train_result = self.extract_features(self.train_data, self.most_common_words_dict, self.train_size,
                                             self.word_count)
        self.train_matrix = train_result['features']
        self.train_labels = train_result['labels']

    def train_model_svm(self):
        model1 = LinearSVC()
        model1.fit(self.train_matrix, self.train_labels)
        self.svm = model1

    def save_module_svm(self):
        joblib.dump(self.svm, self.svm_output_file_name)
