import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime


def secs_to_datetime(a):
    return datetime.fromtimestamp(a)


def get_date_time_str(date_time):
    today_time = secs_to_datetime(date_time)
    time_str = str(today_time.year) + "-" + str(today_time.month) + '-' + str(today_time.day)
    time_str += ':' + str(today_time.hour) + ':' + str(today_time.minute) + ':' + str(today_time.second)
    return str(time_str)


def inactive_seed_send_mail(db, seed_group, current_time):
    seed_group_dict = {'LSINFRA': 'ramakrishna.k@way2online.co.in', 'USemail': 'madhu@way2online.net',
                       'USinfra': 'karthik.k@way2online.co.in', '160by2': 'gireesh.y@way2online.com','SWIFT': 'manohar.p@way2online.com',
                       'P10-US':'karthik.k@way2online.co.in','P10-LS':'ramakrishna.k@way2online.co.in'}
    html_text = '<div dir="ltr"><table cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none"><colgroup><col width="315"><col width="156"><col width="147"></colgroup><tbody><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(159,197,232);text-align:center;border:1px solid rgb(204,204,204)">email</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)">Last updated on</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(182,215,168);text-align:center;border:1px solid rgb(204,204,204)">seedGroup</td></tr>'
    email_td = '<tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(159,197,232);text-align:center;border:1px solid rgb(204,204,204)">'
    seed_group_td = '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(182,215,168);text-align:center;border:1px solid rgb(204,204,204)">'
    updton_td = '<td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)">'
    sender = 'kamesh.happy@gmail.com'
    receivers = ['kameswararao.n@way2online.com', 'bhaskar.v@way2online.co.in', 'surya@way2online.net', 'mahamdali.s@way2online.co.in',
                 seed_group_dict[seed_group]]
    password = 'way2online'
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Inactive seed list"
    msg['From'] = "Bhaskar Vuchentala"
    msg['To'] = ", ".join(receivers)
    find_q = {'seedGroup': seed_group, 'updton': {'$lt': current_time}}
    projet_q = {'seedGroup': 1, 'updton': 1, 'email': 1}
    result = list(db.seed_list.find(find_q, projet_q))
    for row in result:
        tr_row = email_td + row['email'] + "</td>"
        tr_row = tr_row + updton_td + str(get_date_time_str(row['updton'])) + "</td>"
        tr_row = tr_row + seed_group_td + row['seedGroup'] + "</td></tr>"
        html_text += tr_row
    html_text += '</tbody></table></div>'
    html = MIMEText(html_text, 'html')
    msg.attach(html)
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender, password)
        server.sendmail(sender, receivers, msg.as_string())
    except Exception as e:
        print "Error: unable to send email", e
