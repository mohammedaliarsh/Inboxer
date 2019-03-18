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
        today = int(get_time.iso_format(get_time.datetime.now()))
        from_date = today - (n_days * 86400)
        spam_data = list(db.train_data.find({"prdon": {"$gte": from_date}, "type": "spam"}).limit(size))
        ham_data = list(db.train_data.find({"prdon": {"$gte": from_date}, "type": "inbox"}).limit(size))
        result = self.get_train_data(spam_data, ham_data)
        self.train_data = result['data']
        self.train_size = result['size']
        self.most_common_words_dict = self.make_dictionary(self.train_data, self.word_count)
        m_c_w = open('most_common_words.txt', "w+")
        m_c_w.write(json.dumps(self.most_common_words_dict))
        m_c_w.close()
        self.train_matrix = None
        self.train_labels = None
        self.svm = None
        self.train_extract_feautures()
        self.train_model_svm()
        self.save_module_svm()

    @staticmethod
    def get_train_data(spam_data, ham_data):
        spam_len = len(spam_data)
        ham_len = len(ham_data)
        min_len = min(spam_len, ham_len)
        data = []
        for ind in range(0, min_len):
            data.append(spam_data[ind])
        for ind in range(0, min_len):
            data.append(ham_data[ind])
        return {'data': data, 'size': 2 * min_len}

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

    def train_extract_feautures(self):
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
