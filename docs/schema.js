//mongo

var collections = {
    train_data: {
        schema: [
            {
                "_id": 1,
                "template": {
                    "subject": "subj1",
                    "senderName": "senderName1",
                    "tmpl": "body",
                    "domains": [1, 2]
                },
                type: {
                    "inbox": [{dmn: 1}, {dmn: 2}],
                    "updates": [{dmn: 3}, {dmn: 4}],
                    "spam": [{dmn: 5}]
                },
                "time": 1510165800
            }
        ],
        fields: [
            "_id=> auto increment",
            "tmpl => body of the email",
            "type: spam, inbox, updates, promotions",
            "time => processed time"
        ],
        indexes: [
            {
                fields: {type: 1, time: 1}
            }
        ]
    },
    request_data: {
        schema: [
            {
                "_id": 1,
                "input": {
                    "subjects": ["subj1", "subj2", "subj3"],
                    "senderNames": ["send1", "send2", "send3"],
                    "tmpl": "body",
                    "domains": [1, 2, 3, 4, 5]
                },
                "output": {
                    "templates": {
                        "1": "tlaksjdalkf"
                    },
                    "report": [
                        {
                            "tmplId": 1,
                            "subject": "sub1",
                            "senderName": "snd1",
                            "domains": [1, 2],
                            "res": 1,
                            "confidence": {
                                "inbox": 0.8,
                                "updates": 0.1,
                                "poromotions": 0.5,
                                "spam": 0.2
                            }
                        },
                        {
                            "domains": [3, 4],
                            "res": 2
                        }
                    ],
                    "cData": {}
                },
                "time": 1510165800,
                "status": 0
            }
        ],
        fields: [
            "_id=>auto increment",
            "tmpl => template",
            "tmplId=> template id",
            "time => processed time"
        ],
        indexes: [
            {
                fields: {time: 1}
            }
        ]
    },
    tests: {
        schema: [
            {
                _id: 1,
                reqId: 1,
                "tmpl": "<div>alsj</div>",
                "subject": "subj1",
                "senderName": "snd1",
                "fromChange": "spam",
                sent: {
                    "domains": [1, 2, 3, 4],
                    "cData": {}
                },
                resp: {
                    "inbox": [{dmn: 1}, {dmn: 2}],
                    "update": [{dmn: 3}, {dmn: 4}],
                    "spam": [{dmn: 5}]
                },
                time: 134243243
            }
        ],
        fields: [
            "_id=>auto increment",
            "reqId=>taken from request_data _id key"
        ],
        indexes: []
    },
    gmail_data: {
        schema: [
            {
                "_id": 1,
                "testId": 10,
                "domain": 1,
                "toEmail":"alskdfjl@gmail.com",
                "type": "inbox",
                "time": 1297839873,
                "status": 0
            }
        ],
        fields: [
            "_id=>auto increment",
            "testId=>uniq id for each template"
        ],
        indexes: [
            {
                fields: {testId: 1, status: 1}
            }
        ]
    },
    seed_list: {
        schema: [
            {
                "_id": 1,
                "rotate": 1,
                "email": "a@gmail.com"
            }
        ],
        fields: [
            "_id=>auto increment"
        ],
        indexes: []
    },
    unable_to_inbox: {
        schema: [
            {
                "_id": 1,
                "template": {
                    "subject": "subj1",
                    "senderName": "senderName1",
                    "tmpl": "body",
                    "domains": [1, 2]
                },
                "time": 1510165800,
                "status": 0
            }
        ],
        fields: [
            "_id=>auto increment",
            "tmpl => body of the email",
            "time => processed time",
            "status    => 0-not picked, 1-picked"
        ],
        indexes: [
            {
                fields: {time: 1, status: 1}
            }
        ]
    },
    trial_counts: {
        schema: [
            {
                "_id": 1,
                "reqId": 1,
                "count": 1
            }
        ],
        fields: [
            "_id => auto increment",
            "reqId => taken from request_data _id key",
            "count  => how many trials we done"
        ],
        indexes: []
    },
    daily_stats: {
        schema: [
            {
                "_id": 1510165800,
                "o_spam": {
                    "keys": {
                        "sm_ttl": 0,
                        "keys_1": {
                            "am_ttl": 0,
                            "am_spam": 0,
                            "am_ham": 0,
                            "keys_2": {
                                "keys_3": {
                                    "spam": 0,
                                    "ham": 0,
                                    "updt": 0,
                                    "prom": 0,
                                    "imp": 0,
                                    "ttl": 0
                                }
                            }
                        }
                    }
                },
                "keys_4": {
                    "keys_3": {
                        "spam": 0,
                        "ham": 0,
                        "updt": 0,
                        "prom": 0,
                        "imp": 0,
                        "ttl": 0
                    }
                },
                "o_ham": 0,
                "o_unable_to_inbox": 0,
                "o_ttl": 0
            }
        ],
        fields: ["_id =>current date(in iso format)",
            "o_spam =>original msg spam", "o_ham =>original msg inbox", "o_unable_to_inbox =>not able to inbox", "o_ttl=>total msgs",
            "keys  => [f_c, s_c, f_a, d_a]", "f_c   => footer changes", "s_c    => subject changes", "f_a   => font tag added at the end", "d_a    => div tag added",
            "keys_1 =>['sm_spam, sm_ham]", "sm_spam =>spam_module decided spam", "sm_ham =>spam_module decide not spam",
            "keys_2   =>[am_updt, am_prom, am_imp]", "am_updt =>api module decided updte", "am_prom =>api module decided promotion", "am_imp =>api module decided important",
            "keys_3 =>[d_a_f, d_a_m, b_d_a]", "d_a_f =>division tag added front", "d_a_m =>division tag added middle", "b_d_a =>before division tag added",
            "keys_4 =>[o_updt, o_prom, o_imp]", "o_updt =>original msg update", "o_prom =>original msg promotion", "o_imp =>original msg important",
            "sm_ttl => spam_module total",
            "am_ttl => api_module total", "am_spam  =>api_module decided spam", "am_ham =>api_module decide not spam"
        ]
    },
    overall_stats: {
        schema: [
            {
                "o_spam": {
                    "keys": {
                        "sm_ttl": 0,
                        "keys_1": {
                            "am_ttl": 0,
                            "am_spam": 0,
                            "am_ham": 0,
                            "keys_2": {
                                "keys_3": {
                                    "spam": 0,
                                    "ham": 0,
                                    "updt": 0,
                                    "prom": 0,
                                    "imp": 0,
                                    "ttl": 0
                                }
                            }
                        }
                    }
                },
                "keys_4": {
                    "keys_3": {
                        "spam": 0,
                        "ham": 0,
                        "updt": 0,
                        "prom": 0,
                        "imp": 0,
                        "ttl": 0
                    }
                },
                "o_ham": 0,
                "o_unable_to_inbox": 0,
                "o_ttl": 0
            }
        ],
        fields: [
            "o_spam =>original msg spam", "o_ham =>original msg inbox", "o_unable_to_inbox =>not able to inbox", "o_ttl=>total msgs",
            "keys  => [f_c, s_c, f_a, d_a]", "f_c   => footer changes", "s_c    => subject changes", "f_a   => font tag added at the end", "d_a    => div tag added",
            "keys_1 =>['sm_spam, sm_ham]", "sm_spam =>spam_module decided spam", "sm_ham =>spam_module decide not spam",
            "keys_2   =>[am_updt, am_prom, am_imp]", "am_updt =>api module decided updte", "am_prom =>api module decided promotion", "am_imp =>api module decided important",
            "keys_3 =>[d_a_f, d_a_m, b_d_a]", "d_a_f =>division tag added front", "d_a_m =>division tag added middle", "b_d_a =>before division tag added",
            "keys_4 =>[o_updt, o_prom, o_imp]", "o_updt =>original msg update", "o_prom =>original msg promotion", "o_imp =>original msg important",
            "sm_ttl => spam_module total",
            "am_ttl => api_module total", "am_spam  =>api_module decided spam", "am_ham =>api_module decide not spam"
        ]
    }
};


//redis

var keys = {
    "inboxer_ids": {
        "train_data": 1,
        "unable_to_inbox": 1,
        "request_data": 1
    }
};