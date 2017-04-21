import random
import json

def gen_row():
    i = random.randint(0, 10000)
    row = {
        'int': i,
        'float': random.random(),
        'short_string': 'Short String %s' % i,
        'long_string': ('Long String %s ' % i) * random.randint(10, 50),
        'boolean': bool(random.randint(0, 1)),
    }
    ret = {}
    for repeat in range(1,4):
        for k, v in row.items():
            ret['%s_%s' % (k, repeat)] = v if not isinstance(v, str) \
                                         else '%s: %s' % (repeat, v)
    return ret


for fn in range(5):
    with open('f%s.json' % fn, 'w') as f:
        f.write(json.dumps([gen_row() for i in range(50)], indent=2))
