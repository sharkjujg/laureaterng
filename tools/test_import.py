#!/usr/bin/env python3
"""Checks for the conversion in build_pool.py, with inputs shaped like the real API. Usage: python -I tools/test_import.py"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_pool as b  # noqa: E402

eq = lambda got, want: (got == want) or sys.exit(f'FAIL got {got!r}, want {want!r}')

eq(b.en({'en': ' Marie Curie ', 'se': 'x'}), 'Marie Curie'); eq(b.en({'se': 'x'}), None); eq(b.en(None), None); eq(b.en({'en': '  '}), None)
eq(b.date_ok('1943-11-07'), '1943-11-07'); eq(b.date_ok('1948-00-00'), '1948-00-00'); eq(b.date_ok('0000-00-00'), None); eq(b.date_ok('1948'), None); eq(b.date_ok(None), None)
eq(b.place({'city': {'en': 'Breslau'}, 'country': {'en': 'Germany'}, 'countryNow': {'en': 'Poland'}, 'continent': {'en': 'Europe'}}), {'city': 'Breslau', 'country': 'Poland', 'then': 'Germany', 'continent': 'Europe'})
eq(b.place({'city': {'en': 'Oslo'}, 'country': {'en': 'Norway'}, 'countryNow': {'en': 'Norway'}})['then'], None); eq(b.place(None)['country'], None)
person = {'id': '745', 'knownName': {'en': 'A. Michael Spence'}, 'birth': {'date': '1943-11-07', 'place': {'city': {'en': 'Montclair, NJ'}, 'country': {'en': 'USA'}, 'countryNow': {'en': 'USA'}, 'continent': {'en': 'North America'}}},
          'nobelPrizes': [{'awardYear': '2001', 'category': {'en': 'Economic Sciences'}, 'portion': '1/3', 'dateAwarded': '2001-10-10', 'prizeStatus': 'received', 'motivation': {'en': 'for their analyses'},
                           'affiliations': [{'name': {'en': 'Stanford University'}, 'nameNow': {'en': 'Stanford University'}, 'countryNow': {'en': 'USA'}}, {}]}]}
m = b.convert(person)
eq((m['name'], m['org'], m['born'], m['bcountry'], m['died'], m['prizes'][0]['y'], m['prizes'][0]['aff']), ('A. Michael Spence', False, '1943-11-07', 'USA', None, 2001, [{'n': 'Stanford University', 'c': 'USA'}]))
org = {'id': '509', 'orgName': {'en': 'American Friends Service Committee'}, 'founded': {'date': '1917-00-00', 'place': {'city': {'en': 'Washington, D.C.'}, 'countryNow': {'en': 'USA'}}},
       'nobelPrizes': [{'awardYear': '1947', 'category': {'en': 'Peace'}, 'portion': '1/2', 'prizeStatus': 'received', 'motivation': {'en': 'for humanitarian work'}}]}
o = b.convert(org)
eq((o['name'], o['org'], o['born'], o['died'], o['bcity']), ('American Friends Service Committee', True, '1917-00-00', None, 'Washington, D.C.'))
pen = dict(person, id='1', penNameOf='x'); eq(b.convert(pen)['pen'], True)
print('all import checks passed')
