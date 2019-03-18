import numpy as np
from sklearn.externals import joblib
import json


class test_module:
    def __init__(self):
        self.svm_output_file_name = "svm.pkl"
        self.word_count = 3000
        self.svm = joblib.load(self.svm_output_file_name)
        m_c_w = open('most_common_words.txt', "r")
        data = m_c_w.read()
        self.most_common_words_dict = json.loads(data)
        m_c_w.close()

    def extract_string_features_new(self, msg):
        features_matrix = np.zeros((1, self.word_count))
        doc_id = 0
        msg = msg.split()
        for word in msg:
            if word in self.most_common_words_dict:
                word_id = self.most_common_words_dict.keys().index(word)
                features_matrix[doc_id, word_id] = msg.count(word)
        return features_matrix

    def test_data(self, msg):
        test_matrix = self.extract_string_features_new(msg)
        result1 = self.svm.predict(test_matrix)
        return result1[0]
