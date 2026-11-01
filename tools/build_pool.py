#!/usr/bin/env python3
"""Build data/pool-v1.json from the Nobel Prize API (https://api.nobelprize.org/2.1/laureates), whose terms put the data under CC0.
One request, kept in a local cache file so a rerun does not hit the API again ("use a local cache instead of many calls", say the terms).
Every person and every organization that has been awarded a prize is a record; nothing is dropped, altered or left out for being
inconvenient. Gender is not carried into the pool: no badge uses it. A value the API lacks stays null and never satisfies a badge.

Usage: python -I tools/build_pool.py [cache file]     (default: the API response is saved to ./laureates-raw.json)
"""
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.request

UA = 'LaureateRNG-fan-prototype/0.1 (https://github.com/sharkjujg/laureaterng)'
URL = 'https://api.nobelprize.org/2.1/laureates?limit=1100&offset=0'


def en(x):
    """The English form of an API text field ({'en': ..., 'se': ...}), or None."""
    v = x.get('en') if isinstance(x, dict) else None
    return v.strip() if isinstance(v, str) and v.strip() else None


def date_ok(s):
    """The API writes unknown month or day as 00: '1948-00-00'. Keep what is known, as given."""
    return s if isinstance(s, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', s) and s[:4] != '0000' else None


def place(p):
    p = p or {}
    now, then = en(p.get('countryNow')), en(p.get('country'))
    return {'city': en(p.get('city')) or en(p.get('cityNow')), 'country': now or then, 'then': then if then and now and then != now else None, 'continent': en(p.get('continent'))}


def convert(l):
    org = 'orgName' in l
    born = l.get('founded' if org else 'birth') or {}
    died = (l.get('death') or {}) if not org else {}
    b, d = place(born.get('place')), place(died.get('place'))
    prizes = []
    for p in l['nobelPrizes']:
        aff = []
        for a in p.get('affiliations') or []:
            if isinstance(a, dict) and en(a.get('name')):
                aff.append({'n': en(a.get('nameNow')) or en(a['name']), 'c': en(a.get('countryNow')) or en(a.get('country'))})
        prizes.append({'y': int(p['awardYear']), 'cat': en(p['category']), 'share': p.get('portion'), 'motive': en(p.get('motivation')), 'status': p.get('prizeStatus'), 'date': date_ok(p.get('dateAwarded')), 'aff': aff})
    return {'id': l['id'], 'name': en(l.get('orgName')) if org else (en(l.get('knownName')) or en(l.get('fullName'))), 'org': org, 'pen': 'penNameOf' in l,
            'born': date_ok(born.get('date')), 'bcity': b['city'], 'bcountry': b['country'], 'bthen': b['then'], 'bcont': b['continent'],
            'died': date_ok(died.get('date')), 'dcountry': d['country'], 'prizes': prizes}


def main(cache):
    cache = pathlib.Path(cache)
    if not cache.exists():
        with urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': UA}), timeout=120) as r:
            cache.write_bytes(r.read())
    raw = json.loads(cache.read_text(encoding='utf-8'))
    members = sorted((convert(l) for l in raw['laureates']), key=lambda m: int(m['id']))
    ids = [m['id'] for m in members]
    assert len(ids) == len(set(ids)) == raw['meta']['count'], 'the API said a different number of laureates'
    n = len(members)
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    known = lambda f: sum(m[f] is not None for m in members)
    meta = {'version': 'v1', 'publishedAt': today, 'capturedAt': today, 'source': 'Nobel Prize API v2.1 (https://api.nobelprize.org), data under CC0',
            'provenance': f'Snapshot taken {today} by tools/build_pool.py. Source: Nobel Prize Outreach, api.nobelprize.org (CC0).',
            'selection': f'Every person and organization the API lists as a laureate: {sum(not m["org"] for m in members):,} people and {sum(m["org"] for m in members)} organizations, with {sum(len(m["prizes"]) for m in members):,} prizes between them.',
            'fieldStatus': {'id': 'known', 'name': 'known', 'prizes': 'known (year, field, share, citation, status)', 'born': f'known for {known("born"):,} of {n:,}; some give only the year, and a missing month never earns a badge',
                            'bcountry': f'known for {known("bcountry"):,} of {n:,}; the country today', 'died': f'known for {known("died"):,} of {n:,}; blank means the API lists no death',
                            'affiliations': 'known for some prizes; writers and peace laureates often have none'}}
    lines = ',\n'.join('  ' + json.dumps(m, ensure_ascii=False, separators=(',', ':')) for m in members)
    out = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'pool-v1.json'
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(('{"meta":' + json.dumps(meta, ensure_ascii=False) + ',\n"members":[\n' + lines + '\n]}\n').encode('utf-8'))
    print(f'wrote {out}: {n} laureates', flush=True)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'laureates-raw.json')
