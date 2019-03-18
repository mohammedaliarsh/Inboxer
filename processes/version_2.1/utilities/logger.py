import logging
import coloredlogs
import os


class Logger:
    logger = None

    def __init__(self, filename):
        coloredlogs.install()
        self.logger = logging.getLogger(filename)
        if 'LOG_LEVEL' in os.environ and int(os.environ['LOG_LEVEL']) in [10, 20, 30, 40, 50]:
            level = int(os.environ['LOG_LEVEL'])
        else:
            level = logging.INFO
        self.logger.setLevel(level)

    def get_logger(self):
        return self.logger
