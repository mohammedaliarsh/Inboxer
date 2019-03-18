# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup as BS
import urllib
from bs4.element import Comment
from PIL import ImageFile
from tidylib import tidy_document
from logger import Logger
import random
import get_time

logger = Logger(__name__).get_logger()


class validate:
    def __init__(self):
        pass

    @staticmethod
    def tag_visible(element):
        if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
            return False
        if isinstance(element, Comment):
            return False
        return True

    def text_from_html(self, body):
        soup = BS(body, 'html.parser')
        texts = soup.findAll(text=True)
        visible_texts = filter(self.tag_visible, texts)
        return " ".join(t.strip() for t in visible_texts)

    @staticmethod
    def get_image_urls(template):
        soup = BS(template, "lxml")
        image_urls = []
        for imgtag in soup.find_all('img'):
            image_urls.append(imgtag['src'])
        return image_urls

    @staticmethod
    def get_image_size(url):
        file_name = urllib.urlopen(url)
        size = file_name.headers.get("content-length")
        if size: size = int(size)
        p = ImageFile.Parser()
        while 1:
            data = file_name.read(1024)
            if not data:
                break
            p.feed(data)
            if p.image:
                return size, p.image.size
        file_name.close()
        return size, None

    def validate_image_text_ratio_1(self, template, image_ratio, text_ratio):
        all_images = self.get_image_urls(template)
        size_of_images = 0
        for img in all_images:
            try:
                img_size = self.get_image_size(img)
            except:
                img_size = 0
            if img_size:
                size_of_images += img_size[0]
        text_size = len(template)
        if size_of_images / float(text_size) == image_ratio / float(text_ratio):
            return True
        return False

    def validate_image_text_ratio(self, template, image_ratio, text_ratio):
        ret_text = self.text_from_html(template).replace("\\n", "").strip()
        all_images = self.get_image_urls(template)
        size_of_images = 0
        for img in all_images:
            try:
                img_size = self.get_image_size(img)
            except:
                img_size = 0
            if img_size:
                try:
                    size_of_images += img_size[1][0] * img_size[1][1]
                except:
                    pass
        len_of_text = len(ret_text)
        area_of_ret_text = len_of_text * 64
        if size_of_images != 0:
            calculated_ratio = (area_of_ret_text / float(size_of_images)) * 100
            given_inputs_ratio = (text_ratio / float(image_ratio)) * 100
            logger.info("area of text:" + str(area_of_ret_text) + "=>size of images:" + str(size_of_images))
            logger.info("calculated ratio:" + str(calculated_ratio) + "=>given_inputs_ratio:" + str(given_inputs_ratio))
            if calculated_ratio < given_inputs_ratio:
                return True
            else:
                return False
        return False

    def add_doc_type(self, errors):
        doc_types = [
            '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">',
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">',
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
        ]
        for row in errors:
            if 'Warning:' in row:
                row = row.split('Warning:')
                warning = row[1].strip()
                if warning == "missing <!DOCTYPE> declaration":
                    rand_num = random.randint(0, len(doc_types) - 1)
                    template = doc_types[rand_num] + template
                elif warning == '<table> lacks "summary" attribute':
                    soup = BS(template, "lxml")
                    table_str = soup.find_all('table')
                    for row in table_str:
                        row = str(row)
                        print row
                        replace_str = row.replace("<table", "<table summary=\"\"")
                        template = template.replace(row, replace_str)
                    print template
                else:
                    # print warning
                    pass
            else:
                pass
                # logger.info(str(errors))

    @staticmethod
    def validate_html_code(template, mongodb, redis_db):
        _id_key = redis_db.incr('html_log')
        document, errors = tidy_document(template, options={'numeric-entities': 1, 'char-encoding': 'utf8'})
        errors = errors.split('\n')
        mongodb.html_log.insert({'_id': _id_key, 'time': get_time.datetime_to_secs(), 'tmpl': template, 'log': errors})
        return document
