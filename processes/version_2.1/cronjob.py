from crontab import CronTab
import sys

my_cron = CronTab(user='root')

job = my_cron.new(command='python ' + sys.argv[1] + ' ' + sys.argv[2])
# "*/5 * * * *" every 5 minutes
# 0 8 * * * every day 8 o clock
time_str = "0 8 * * *"
job.setall(time_str)
my_cron.write()
