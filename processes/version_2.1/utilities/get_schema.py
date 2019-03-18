def get_schema():
    return {
        "ham": 0,
        "spam": 0,
        "ttl": 0
    }


def get_daily_stats():
    keys_list = ['t_p_s', 't_d_c', 's_p_s', 's_n_c', 'sb_d_a', 'sb_ps', 'all_p_s']
    daily_stats = {'o_spam': {}}
    for key in keys_list:
        daily_stats['o_spam'][key] = get_schema()
    daily_stats["o_spam"]['ttl'] = 0
    daily_stats["o_unable_to_inbox"] = 0
    daily_stats["r_ttl"] = 0
    daily_stats["o_ham"] = 0
    daily_stats["ttl"] = 0
    return daily_stats


def get_sm_schema():
    return {'ttl': 0, 'ham': {'ttl': 0, 'ham': 0, 'spam': 0, 'failed': 0},
            'spam': {'ttl': 0, 'ham': 0, 'spam': 0, 'failed': 0}}
