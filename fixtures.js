// LaureateRNG fixtures for check.html. The per-rule cases are written next to each rule in rules.js (qualifies, narrowly fails,
// boundary, missing, malformed); this file gathers them and adds the checks on the published pool.
import { cases as ruleCases } from './rules.js';

export const V = '2026-11-01';
export const base = {}; // every case carries its own complete base record
export const cases = ruleCases;

export function poolChecks(raw, pool, ok) {
  const ms = raw.members, CATS = ['Physics', 'Chemistry', 'Physiology or Medicine', 'Literature', 'Peace', 'Economic Sciences'];
  ok('laureate ids are numeric strings and ascend', ms.every((m, i) => /^[1-9]\d*$/.test(m.id) && (i === 0 || +m.id > +ms[i - 1].id)));
  ok('every laureate has a name and at least one prize', ms.every((m) => m.name && m.prizes.length >= 1));
  ok('every prize has a year from 1901, a known field, a share and a citation', ms.every((m) => m.prizes.every((p) => p.y >= 1901 && p.y <= +raw.meta.capturedAt.slice(0, 4) && CATS.includes(p.cat) && ['1', '1/2', '1/3', '1/4'].includes(p.share) && p.motive)));
  ok('prize shares of one field and year add up to at most one whole', (() => { const t = new Map(); for (const m of ms) for (const p of m.prizes) { const [a, b] = p.share.split('/').map(Number), key = `${p.y}|${p.cat}`; t.set(key, (t.get(key) ?? 0) + a / (b ?? 1)); } return [...t.values()].every((x) => x <= 1.0001); })());
  ok('no one is born after they were awarded, or dies before being born', ms.every((m) => !m.born || m.born.startsWith('0000') || m.prizes.every((p) => p.y >= +m.born.slice(0, 4) || m.org) ) && ms.every((m) => !m.died || !m.born || m.died.slice(0, 4) >= m.born.slice(0, 4)));
  ok('only people carry a death, and no person is older than 125', ms.every((m) => !m.org || !m.died) && ms.every((m) => !m.born || !m.died || +m.died.slice(0, 4) - +m.born.slice(0, 4) < 125));
  ok('there are 28 organizations and the people number over 990', ms.filter((m) => m.org).length === 28 && ms.filter((m) => !m.org).length > 990);
  ok('no gender field is carried into the pool (no badge may use it)', ms.every((m) => !('gender' in m)));
  ok('a laureate with several prizes lists them in year order', ms.every((m) => m.prizes.every((p, i) => i === 0 || p.y >= m.prizes[i - 1].y)));
  ok('the pool is large enough to be a game (>= 1000)', pool.n >= 1000);
}
