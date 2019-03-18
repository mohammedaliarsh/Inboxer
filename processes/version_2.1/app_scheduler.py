import eds_stats, send_stats_mail, update_stats
from apscheduler.schedulers.blocking import BlockingScheduler

from utilities.logger import Logger

logger = Logger(__name__).get_logger()


def call_get_data_from_eds_stats():
    logger.info("starting getting data from eds_stats")
    eds_stats_obj.get_data_from_db()
    logger.info("completed getting data from eds_stats")


def call_send_stats_mail():
    logger.info("starting sending stats mail")
    send_mail_obj.get_data_from_db_and_send_mail()
    logger.info("completed sending stats mail")


def call_update_stats():
    logger.info("starting update_stats in db")
    update_stats_obj.update_stats_in_db()
    logger.info("completed update_stats in db")


sched = BlockingScheduler()
eds_stats_obj = eds_stats.eds_stats_report("live")
send_mail_obj = send_stats_mail.send_stats("live")
update_stats_obj = update_stats.update_stats("live")

sched.add_job(call_update_stats, 'cron', hour="*", minute="*/5")
sched.add_job(call_get_data_from_eds_stats, 'cron', hour=3, minute=0)
sched.add_job(call_send_stats_mail, 'cron', hour=3, minute=30)

sched.start()
