import redis
from pymongo import MongoClient
import pika


class connections:
    def __init__(self):
        pass

    @staticmethod
    def get_mongo_connection(data):
        client = MongoClient(data['mongodb']['host'], data['mongodb']['port'])
        client.inboxer.authenticate(data['mongodb']['user'], data['mongodb']['password'], mechanism="SCRAM-SHA-1")
        return client.inboxer

    @staticmethod
    def get_redis_connection(data):
        return redis.StrictRedis(host=data["redis"]["host"], port=data["redis"]["port"],
                                 db=data["redis"]["db"], password=data["redis"]["password"])

    @staticmethod
    def get_rabbitmq_connection(data):
        url = "amqp://" + data['rabbitmq']['user'] + ":" + data['rabbitmq']['password'] + "@" + data['rabbitmq']['host']
        url += ":" + str(data['rabbitmq']['port'])
        con = pika.BlockingConnection(pika.URLParameters(url))
        return con
