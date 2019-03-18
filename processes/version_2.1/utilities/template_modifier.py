# -*- coding: utf-8 -*-
import random
from bs4 import BeautifulSoup
import copy
from logger import Logger

logger = Logger(__name__).get_logger()


class template_modifier:
    def __init__(self):
        pass

    @staticmethod
    def generate_color():
        return '#%02X%02X%02X' % (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

    @staticmethod
    def get_end(start, footer):
        ind = 0
        for c in footer[start:]:
            if c == ';':
                break
            ind += 1
        return start + ind + 1

    @staticmethod
    def get_font_size_end(start, footer):
        data = footer[start:]
        end_ind = data.index('px')
        return start + end_ind

    def change_color(self, footer, thread_name):
        start = footer.find('color:', 0)
        try:
            while start != -1:
                end = self.get_end(start, footer)
                old_color = footer[start:end]
                new_color = "color:" + self.generate_color() + ";"
                logger.info(thread_name + "Colors=>Old:" + old_color + " New:" + new_color + " Thread:")
                footer = footer.replace(old_color, new_color, 1)
                start = footer.find('color:', start + 1)
        except Exception as e:
            logger.warning("Color Changing Exception:" + str(e))
        return footer

    def change_font_size(self, footer, thread_name):
        start = footer.find('font-size:')
        if start != -1:
            try:
                end = self.get_font_size_end(start, footer)
                old_font_size = footer[start:end]
                siz = int(old_font_size[len('font-size:'):len(old_font_size)])
                siz -= 1
                new_font_size = "font-size:" + str(siz) + "px;"
                logger.info(
                    thread_name + "Fonts=>Old:" + str(old_font_size) + " New:" + str(new_font_size) + " Thread:")
                return footer.replace(old_font_size, new_font_size)
            except Exception as e:
                logger.warning("font-size:Exception:" + str(e))
        return footer

    def add_tag_in_footer(self, footer, thread_name):
        try:
            string = ""
            for x in BeautifulSoup(footer, 'lxml').find_all("td"):
                string += x.text
            string = string.strip()
            if string:
                old_string = string.strip()
                old_string_array = old_string.split()
                start = footer.find(str(old_string_array[0]))
                end_str = str(old_string_array[len(old_string_array) - 1])
                end = footer.find(end_str) + len(end_str)
                old_string = footer[start:end]
                old_string_array = old_string.split()
                length = len(old_string_array)
                num = random.randint(0, length - 1)
                c = 0
                st = 0
                while not old_string_array[num].isalpha():
                    num = random.randint(0, length - 1)
                    c += 1
                    if c > length:
                        st = 1
                        break
                if st == 0:
                    tags = ['b', 'i', 'small', 'strong', 'sub', 'sup', 'em', 'mark']
                    which_tag = random.randint(0, 7)
                    old_string_array[num] = "<" + tags[which_tag] + ">" + str(
                        old_string_array[num]) + "</" + tags[which_tag] + ">"
                    new_string = ' '.join(old_string_array)
                    logger.info(thread_name + "Tag=>Old:" + old_string + " New:" + new_string + " Thread:")
                    footer = footer.replace(old_string, new_string)
        except Exception as e:
            logger.warning("Footer adding Exception:" + str(e))
        return self.convert_to_string(footer)

    def footer_changes(self, input_str, thread_name):
        input_str = self.convert_to_string(input_str)
        start_str = "<tr>"
        end_str = "</tr>"
        start = input_str.rfind(start_str)
        end = input_str.rfind(end_str) + len(end_str)
        footer_original = input_str[start:end]
        footer = self.change_color(footer_original, thread_name)
        footer = self.change_font_size(footer, thread_name)
        footer = self.add_tag_in_footer(footer, thread_name)
        input_str = input_str.replace(footer_original, footer)
        return input_str

    def font_tag_adding(self, body, thread_name):
        body = self.convert_to_string(body)
        add_font_tag = "<font color='#FFFFFF'>check this</font>"
        body += add_font_tag
        logger.info(thread_name + "FontTagAdding:" + add_font_tag + "Thread:")
        return body

    def div_tag_adding(self, body, thread_name):
        body = self.convert_to_string(body)
        div_tag = self.get_div_tag(body)
        logger.info(thread_name + "Div_Tag_First:" + div_tag + " Thread:")
        body = div_tag + body
        return body

    def modifying_prom_spam(self, content, thread_name, spam_prom_keywords):
        content_copy = self.convert_to_string(copy.deepcopy(content).lower())
        count = 0
        limit_count = 5
        replace_keys_dict = {}
        no_change_keys = []
        find_keys = []
        break_count = 0
        content_len = len(content_copy)
        for key in spam_prom_keywords:
            key = self.convert_to_string(key)
            if key in content_copy:
                index = content_copy.index(key)
                replace_key = content[index:index + len(key)]
                change_rep_key = replace_key
                new_key = self.get_changed_key(change_rep_key, thread_name)
                logger.info(thread_name + " =>old_key:" + str(replace_key) + "=>New_key:" + str(new_key))
                if new_key == "No Change":
                    no_change_keys.append(replace_key)
                else:
                    logger.info(thread_name + "=>-------------change done---------")
                    replace_keys_dict[replace_key] = new_key
                key_len = len(key)
                if key_len + index < content_len:
                    if content_copy[key_len + index] == ' ':
                        break_count += 1
                count += 1
                find_keys.append(key)
            if break_count == limit_count:
                logger.info("")
                break
        if count == 0:
            logger.info(thread_name + "=>No Spam Prom key words found")
        for key in replace_keys_dict:
            content = content.replace(key, replace_keys_dict[key])
        subject = content
        is_there_change = 0
        logger.info(thread_name + "==>count:" + str(count) + "===>" + str(no_change_keys))
        for key in no_change_keys:
            subject_len = len(subject)
            try:
                ind = subject.index(key)
                length = len(key)
                if length + ind < subject_len:
                    # if key is not last key keyword==>this is briton world==>briton is key
                    if subject[length + ind] == " ":
                        # space is there after key==>in above sentence space is there after key
                        logger.info(thread_name + "==>" + key + "------------------------->change done")
                        if subject[ind + length + 1].islower():
                            # next keyword first letter smaller=>this is briton world==>this is britonWorld
                            subject = subject[:ind] + key[0].lower() + key[1:] + subject[
                                ind + length + 1].upper() + subject[ind + length + 2:]
                        else:
                            # next keyword first letter is upper=>this is briton world==>this is britonWorld
                            subject = subject[:ind] + key[0].lower() + key[1:] + subject[ind + length + 1:]
                    else:
                        # space is not there after key==>this is briton-world
                        # here we are checking space is there before key
                        if ind != 0:
                            # key is not starting keyword=>this is briton-world
                            if subject[ind - 1].isspace():
                                # space is there before key=>this is briton-world==>this isBriton-world
                                logger.info(thread_name + "==>" + key + "------------------->no_change-->change done")
                                subject = subject[:ind - 1] + subject[ind].upper() + subject[ind + 1:]
                            else:
                                # no space is before key=>this is-briton-world==>this is-briton-world
                                is_there_change += 1
                                logger.info(thread_name + "==>" + key + "=>No Change")
                        else:
                            # key is starting so no space before it=>briton-world==>briton-world
                            is_there_change += 1
                            logger.info(thread_name + "==>" + key + "=>No Change")
                else:
                    # key is last key word
                    if subject[ind].islower():
                        if ind != 0 and subject[ind - 1].isspace():
                            # before space is there=>hi india==>hiIndia
                            logger.info(thread_name + "==>" + key + "------------------------->change done")
                            subject = subject[:ind - 1] + subject[ind].upper() + subject[ind + 1:]
                        else:
                            logger.info(thread_name + "==>" + key + "=>No Change")
                            is_there_change += 1
                    else:
                        if ind != 0 and subject[ind - 1].isspace():
                            # before space is there=>hi India==>hiIndia
                            logger.info(thread_name + "==>" + key + "------------------------->change done")
                            subject = subject[:ind - 1] + subject[ind:]
                        else:
                            logger.info(thread_name + "==>" + key + "=>No Change")
                            is_there_change += 1
            except ValueError as e:
                logger.info(thread_name + "=>Exception in spam prom keywords=>" + str(e))
                is_there_change += 1
        if is_there_change == count:
            count = 0
        return {'content': subject, 'found': count, 'find_keys': find_keys}

    @staticmethod
    def get_changed_key(key, thread_name):
        try:
            key_split = key.split(' ')
            ret_key = key_split[0]
            length = len(key_split)
            if length >= 2:
                went_status = 0
                for i in range(1, length):
                    if key_split[i][0].islower():
                        ret_key += key_split[i][0].upper() + key_split[i][1:]
                    else:
                        went_status = 1
                        ret_key += key_split[i][0].upper() + key_split[i][1:]
                if went_status:
                    ret_key = ret_key[0].lower() + ret_key[1:]
            else:
                return "No Change"
            return ret_key
        except Exception as e:
            logger.warning(thread_name + " Exception occurred while key change=>" + str(e))
            return "No Change"

    @staticmethod
    def convert_to_string(msg):
        if isinstance(msg, str):
            msg = msg.decode('utf-8').encode('utf-8')
        else:
            msg = msg.encode('utf-8')
        return msg

    def subject_changes(self, subject, thread_name):
        subject = self.convert_to_string(subject)
        old_string_array = subject.split()
        length = len(old_string_array)
        num = random.randint(0, length - 1)
        spac_count = random.randint(1, 3)
        spac = ""
        for i in range(spac_count):
            spac += " "
        old_string_array[num] += spac
        new_string = ' '.join(old_string_array)
        new_string += '.'
        logger.info(thread_name + "Subject=>Old:" + subject + " New:" + new_string + " Thread:")
        return new_string

    def add_subject(self, template):
        body = self.convert_to_string(template['tmpl'])
        if template['subjects']:
            subject = template['subjects'][0]
        else:
            subject = "it's a hidden division"
        div_tag = "<div style='display:none'>" + str(self.convert_to_string(subject)) + "</div>"
        body += div_tag
        return body

    def get_div_tag(self, body):
        string = ""
        for x in BeautifulSoup(body, 'lxml').find_all("td"):
            x = x.text.split()
            c = 0
            for i in x:
                string += " " + i
                c += 1
                if c >= 5:
                    break
            break
        if string:
            div_tag = "<div style='display:none'>" + string + "</div>"
        else:
            div_tag = "<div style='display:none'>it's a hidden division</div>"
        return self.convert_to_string(div_tag)

    def div_tag_adding_in_middle(self, body, thread_name):
        body = self.convert_to_string(body)
        div_tag = self.get_div_tag(body)
        old_msg = body[body.find('</a>'):]
        body = body.replace(old_msg, div_tag + old_msg)
        logger.info(thread_name + "Div_Tag_Adding_Middle=>" + div_tag + " Thread:")
        return body

    @staticmethod
    def modify_sender_name(sender_name, thread_name):
        try:
            sender_name_splits = sender_name.split(' ')
            ret_sender_name = ''
            if len(sender_name_splits) >= 2:
                ret_sender_name += sender_name_splits[0]
                try:
                    if sender_name_splits[1][0].islower():
                        ret_sender_name += sender_name_splits[1][0].upper() + sender_name_splits[1][1:]
                    elif sender_name_splits[1][0].isupper():
                        ret_sender_name += ' ' + sender_name_splits[1][0].lower() + sender_name_splits[1][1:]
                    else:
                        ret_sender_name += sender_name_splits[1]
                    for i in range(2, len(sender_name_splits)):
                        ret_sender_name += ' ' + sender_name_splits[i]
                except Exception as e:
                    logger.warning(thread_name + " exception while modifying sender name" + str(e))
                    ret_sender_name += sender_name_splits[1]
            else:
                if sender_name.islower():
                    ret_sender_name += sender_name[0].upper() + sender_name[1:]
                elif sender_name.isupper():
                    ret_sender_name += sender_name.lower()
                else:
                    if sender_name[0].islower():
                        ret_sender_name += sender_name[0].upper() + sender_name[1:]
                    else:
                        ret_sender_name += sender_name + ' '
            logger.info(thread_name + "=>old_sender_name" + sender_name + ":New_sender_name:" + ret_sender_name)
            return ret_sender_name
        except Exception as e:
            logger.warning(thread_name + " exception in modifying sender name" + str(e))
            return sender_name + ' '

    @staticmethod
    def get_change_key(key, thread_name):
        try:
            key_split = key.split(' ')
            ret_key = key_split[0]
            length = len(key_split)
            went_status = 0
            for i in range(1, length):
                if key_split[i][0].islower():
                    ret_key += key_split[i][0].upper() + key_split[i][1:]
                else:
                    went_status = 1
                    ret_key += key_split[i][0].upper() + key_split[i][1:]
            if went_status:
                ret_key = ret_key[0].lower() + ret_key[1:]
        except Exception as e:
            logger.warning(thread_name + " Exception occurred while key change=>" + str(e))
            ret_key = "No Change"
        return ret_key

    def modify_prom_spam(self, content, thread_name, spam_prom_keywords):
        content_copy = self.convert_to_string(copy.deepcopy(content).lower())
        limit_count = 3
        replace_keys_dict = {}
        find_keys = []
        break_count = 0
        key_after_space_list = []
        key_before_space_list = []
        for key in spam_prom_keywords:
            key = self.convert_to_string(key)
            split_key = key.split(' ')
            if len(split_key) >= 2:
                if key in content_copy:
                    index = content_copy.index(key)
                    replace_key = content[index:index + len(key)]
                    change_rep_key = replace_key
                    new_key = self.get_change_key(change_rep_key, thread_name)
                    logger.info(thread_name + " =>old_key:" + str(replace_key) + "=>New_key:" + str(new_key))
                    if new_key != "No Change":
                        break_count += 1
                        replace_keys_dict[replace_key] = new_key
                        logger.info(thread_name + "=>-------------change done---------")
                    find_keys.append(key)
            else:
                key_after_space = key + " "
                key_before_space = " " + key
                if key_after_space in content_copy:
                    key_after_space_list.append(key_after_space)
                    break_count += 1
                    find_keys.append(key)
                elif key_before_space in content_copy:
                    key_before_space_list.append(key_before_space)
                    break_count += 1
                    find_keys.append(key)
            if break_count == limit_count:
                break
        for key in replace_keys_dict:
            content = content.replace(key, replace_keys_dict[key])
        for key in key_after_space_list:
            try:
                content_copy = copy.deepcopy(content).lower()
                ind = content_copy.index(key)
                content_len = len(content)
                length = len(key)
                if ind + length < content_len:
                    index = ind + length
                    key_part = content[:ind] + content[ind].lower() + content[ind + 1:index - 1]
                    content = key_part + content[index].upper() + content[index + 1:]
                    logger.info(thread_name + " key after space change done--->" + key)
            except Exception as e:
                logger.warning(thread_name + "=>Exception in key after space replacing=>" + str(e))
        for key in key_before_space_list:
            try:
                content_copy = copy.deepcopy(content).lower()
                ind = content_copy.index(key)
                if ind != 0:
                    before_part = content[:ind - 1] + content[ind - 1].lower()
                    content = before_part + content[ind + 1].upper() + content[ind + 2:]
                    logger.info(thread_name + " key before space change done--->" + key)
            except Exception as e:
                logger.warning(thread_name + "=>Exception in key before space replacing=>" + str(e))
        return {'content': content, 'found': break_count, 'find_keys': find_keys}
