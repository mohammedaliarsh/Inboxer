var collections = {
    campaigns_master: {
        schema: [
            {
                "_id": 1,
                "senderName": "Amazon",
                "subject": "Free delivery"
            }
        ],
        fields: [
            "_id=> campaign Id (auto_increment)"
        ],
        indexes: []
    },
    domains_master: {
        schema: [
            {
                "_id": 1,
                "domainName": "learnsocial.me"
            }
        ],
        fields: [
            "_id=> domain Id"
        ],
        indexes: []
    },
    train_data: {
        schema: [
            {
                "_id": 1,
                "date": 1234123123,
                "eds_inbox": 45,
                "eds_spam": 55,
                "eds_volume": 200,
                "way2_open": 10,
                "way2_reach": 90,
                "type": "inbox",
                "domainId": 22
            }
        ],
        fields: [
            "_id=> campaignId"
        ],
        indexes: []
    },
    processed_data: {
        schema: [
            {
                "_id": 1,
                "date": 1234123123,
                "eds_inbox": 45,
                "eds_spam": 55,
                "eds_volume": 200,
                "way2_open": 10,
                "way2_reach": 90,
                "type": "inbox",
                "domainId": 22,
                "campaignId": 1
            }
        ],
        fields: [
            "_id=>autoIncrement",
            "type==>decided by ml algorithm"
        ],
        indexes: []
    },
    inbox_spam_counts: {
        schema: [
            {
                "_id": 1,
                "date": 12323123,
                "domainId": 23,
                "inbox_count": 12,
                "spam_count": 22,
                "total_count": 34
            }
        ],
        fields: [
            "_id=>auto increment"
        ],
        indexes: []
    },
    classified_data: {
        schema: [
            {
                "_id": 1,
                "date": 1123123123,
                "domainId": 1,
                "type": "high"
            }
        ],
        fields: [
            "_id=>auto increment",
            "type=>high low midium"
        ],
        indexes: []
    }
};