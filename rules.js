// LaureateRNG badge rules. Each rule is a deterministic predicate over known fields: a value the API lacks never matches.
// test(m, poolDate) and evidence(m, poolDate) read the prepared member from prep(). The kit writes each rule's fixtures beside it.
// Deliberately absent: any badge about gender, and any ranking of people by nationality. The terms of the data ask that it is not used
// to discredit or discriminate, so badges describe prizes, places, dates and wording, which are facts about the award.
import { kit, norm, text } from './kit.js';

export const RULESET = '1';
export { norm };

const ymd = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? ''); return m ? { y: +m[1], m: +m[2] || null, d: +m[3] || null } : null; }; // a zero month or day means unknown
const year = (x) => (x && x.y >= 1000 && x.y <= 2100 ? x.y : null);
const clean = (p) => (p && Number.isInteger(p.y) && p.y >= 1901 && p.y <= 2100 && text(p.cat)
  ? { y: p.y, cat: text(p.cat), share: text(p.share), motive: text(p.motive), status: text(p.status), date: text(p.date),
      aff: (Array.isArray(p.aff) ? p.aff : []).filter((a) => a && text(a.n)).map((a) => ({ n: text(a.n), c: text(a.c) })) } : null);
const between = (a, b) => { // whole years from date a to date b; falls back to calendar years when a month or day is missing
  if (!a || !b) return null;
  const known = a.m && a.d && b.m && b.d;
  return b.y - a.y - (known && (b.m < a.m || (b.m === a.m && b.d < a.d)) ? 1 : 0);
};

export function prep(raw) {
  const prizes = (Array.isArray(raw.prizes) ? raw.prizes : []).map(clean).filter(Boolean), name = text(raw.name) ?? 'Unnamed laureate';
  const born = ymd(raw.born), died = ymd(raw.died), person = raw.org !== true;
  const ages = person && year(born) ? prizes.map((p) => between(born, ymd(p.date) ?? { y: p.y })).filter((a) => a !== null && a >= 0 && a < 120) : [];
  const life = person && year(born) && year(died) ? between(born, died) : null;
  const insts = [...new Set(prizes.flatMap((p) => p.aff.map((a) => a.n)))];
  return {
    ...raw, kind: 'laureate', name, lab: name, org: !person, n: norm(name), prizes, count: prizes.length, cats: new Set(prizes.map((p) => p.cat)), shares: new Set(prizes.map((p) => p.share)),
    statuses: new Set(prizes.map((p) => p.status)), first: prizes[0] ?? null, years: prizes.map((p) => p.y),
    bY: person ? year(born) : null, bM: person && born ? born.m : null, bD: person && born ? born.d : null, dY: person ? year(died) : null, life: life !== null && life >= 0 && life < 125 ? life : null,
    age1: ages.length ? ages[0] : null, bcountry: text(raw.bcountry), bcont: text(raw.bcont), bthen: text(raw.bthen), pen: raw.pen === true, insts,
    abroad: !!text(raw.bcountry) && prizes.some((p) => p.aff.some((a) => a.c && a.c !== text(raw.bcountry))), mot: prizes.map((p) => (p.motive ?? '').toLowerCase()).join(' | '), motive1: prizes[0]?.motive ?? null,
  };
}

const P = (o = {}) => ({ y: 1990, cat: 'Physics', share: '1/2', motive: 'for a discovery', status: 'received', date: '1990-10-10', aff: [], ...o });
const BASE = { kind: 'laureate', id: '1', name: 'Test Person', org: false, pen: false, born: '1950-06-15', bcity: null, bcountry: null, bthen: null, bcont: null, died: null, dcountry: null, prizes: [P()] };
const k = kit('laureate', BASE, {});
const only = (o) => ({ prizes: [P(o)] });
const aged = (a) => ({ born: `${2000 - a}-01-01`, prizes: [P({ y: 2000, date: '2000-10-10' })] });
const lived = (a) => ({ born: '1900-06-15', died: `${1900 + a}-12-31` });

k.when('Laureate', 'Kind', 'Has been awarded a prize', () => true, (m) => `${m.lab} has been awarded ${m.count} prize${m.count === 1 ? '' : 's'}`, [[{}, true]]);
k.when('Organization Laureate', 'Laureate kind', 'An organization, not a person', (m) => m.org, (m) => `${m.lab} is an organization`, [[{ org: true }, true], [{ org: false }, false], [{ org: 'yes' }, false]]);

// the field of the prize: a laureate has one or more
for (const [nm, cat] of [['Physics Laureate', 'Physics'], ['Chemistry Laureate', 'Chemistry'], ['Medicine Laureate', 'Physiology or Medicine'], ['Literature Laureate', 'Literature'], ['Peace Laureate', 'Peace'], ['Economics Laureate', 'Economic Sciences']]) {
  k.when(nm, 'Prize field', `Awarded a prize in ${cat}`, (m) => m.cats.has(cat), (m) => `${m.lab} was awarded the prize in ${cat}`, [[only({ cat }), true], [only({ cat: 'Other' }), false], [{ prizes: [] }, false]]);
}
k.when('Two-Time Laureate', 'Prize repeats', 'Awarded two or more prizes', (m) => m.count >= 2, (m) => `${m.lab} was awarded ${m.count} prizes (${m.years.join(', ')})`, [[{ prizes: [P(), P({ y: 1995 })] }, true], [{ prizes: [P()] }, false], [{ prizes: [] }, false]]);
k.when('Double Field', 'Prize fields', 'Awarded prizes in two different fields', (m) => m.cats.size >= 2, (m) => `${m.lab} won in ${[...m.cats].join(' and ')}`, [[{ prizes: [P(), P({ y: 1995, cat: 'Chemistry' })] }, true], [{ prizes: [P(), P({ y: 1995 })] }, false]]);
for (const [nm, share, what] of [['Sole Laureate', '1', 'the whole prize'], ['Half Share', '1/2', 'half of a prize'], ['Third Share', '1/3', 'a third of a prize'], ['Quarter Share', '1/4', 'a quarter of a prize']]) {
  k.when(nm, 'Prize share', `Received ${what}`, (m) => m.shares.has(share), (m) => `${m.lab} received ${what}`, [[only({ share }), true], [only({ share: '2/3' }), false], [{ prizes: [] }, false]]);
}
k.when('Declined the Prize', 'Prize status', 'Declined the prize when it was offered', (m) => m.statuses.has('declined'), (m) => `${m.lab} declined the prize`, [[only({ status: 'declined' }), true], [only({ status: 'received' }), false], [{ prizes: [] }, false]]);
k.when('Prize Under Restriction', 'Prize status', 'Awarded a prize the API marks as restricted (the laureate could not collect it in the usual way)', (m) => m.statuses.has('restricted'), (m) => `${m.lab}'s prize is marked restricted`, [[only({ status: 'restricted' }), true], [only({ status: 'received' }), false]]);
for (let d = 1900; d <= 2020; d += 10) {
  const lo = Math.max(d, 1901); // the first prizes were awarded in 1901
  k.when(`Prize of the ${d}s`, 'Prize decade', `Awarded a prize from ${lo} to ${d + 9}`, (m) => m.years.some((y) => y >= d && y <= d + 9), (m) => `${m.lab} was awarded in ${m.years.join(' and ')}`,
    [[only({ y: lo }), true], [only({ y: d + 9 }), true], [only({ y: d + 10 }), false], ...(d > 1900 ? [[only({ y: d - 1 }), false]] : [])]);
}
// age when the first prize was awarded (people with a known birth year only)
const ageRule = (nm, family, text, test, probes) => k.when(nm, family, text, test, (m) => `${m.lab} was ${m.age1} when the prize was awarded`, probes);
ageRule('Under Forty', 'Laureate youth', 'Aged under 40 when the prize was awarded', (m) => m.age1 !== null && m.age1 < 40, [[aged(39), true], [aged(40), false], [{ born: null }, false], [{ org: true, ...aged(30) }, false]]);
ageRule('Under Thirty-Five', 'Laureate youth', 'Aged under 35 when the prize was awarded', (m) => m.age1 !== null && m.age1 < 35, [[aged(34), true], [aged(35), false], [{ born: null }, false]]);
ageRule('Seasoned Laureate', 'Laureate age', 'Aged 70 or more when the prize was awarded', (m) => m.age1 !== null && m.age1 >= 70, [[aged(70), true], [aged(69), false], [{ born: null }, false]]);
ageRule('Octogenarian Laureate', 'Laureate age', 'Aged 80 or more when the prize was awarded', (m) => m.age1 !== null && m.age1 >= 80, [[aged(80), true], [aged(79), false]]);
ageRule('Nonagenarian Laureate', 'Laureate age', 'Aged 90 or more when the prize was awarded', (m) => m.age1 !== null && m.age1 >= 90, [[aged(90), true], [aged(89), false]]);
k.when('Birthday Prize', 'Laureate timing', 'Awarded the prize within a week of their birthday', (m) => m.first !== null && m.bM !== null && m.bD !== null && !!m.first.date && (() => {
  const a = ymd(m.first.date), t = (y, mo, d) => Date.UTC(y, mo - 1, d);
  return a !== null && a.m !== null && a.d !== null && Math.abs(t(a.y, a.m, a.d) - t(a.y, m.bM, m.bD)) <= 7 * 86400000;
})(), (m) => `${m.lab} was born on ${m.born} and awarded on ${m.first.date}`, [[{ born: '1950-10-12', prizes: [P({ date: '1990-10-10' })] }, true], [{ born: '1950-10-20', prizes: [P({ date: '1990-10-10' })] }, false], [{ born: '1950-00-00' }, false], [{ born: null }, false]]);
// life
const lifeRule = (nm, text, test, probes) => k.when(nm, 'Laureate life', text, test, (m) => `${m.lab} lived ${m.life} years`, probes);
lifeRule('Lived to Ninety', 'Lived 90 years or more', (m) => m.life !== null && m.life >= 90, [[lived(90), true], [lived(89), false], [{ died: null }, false]]);
lifeRule('Centenarian', 'Lived 100 years or more', (m) => m.life !== null && m.life >= 100, [[lived(100), true], [lived(99), false], [{ died: null }, false]]);
k.when('Still Living', 'Laureate life', 'A person with no death recorded in the API', (m) => !m.org && m.died === null, (m) => `${m.lab} has no recorded death`, [[{ died: null }, true], [{ died: '2000-01-01' }, false], [{ org: true, died: null }, false]]);
// birth
k.when('Born Before 1850', 'Birth decade', 'Born before 1850', (m) => m.bY !== null && m.bY < 1850, (m) => `${m.lab} was born in ${m.bY}`, [[{ born: '1849-12-31' }, true], [{ born: '1850-01-01' }, false], [{ born: null }, false], [{ org: true, born: '1700-01-01' }, false]]);
for (let d = 1850; d <= 1990; d += 10) {
  k.when(`Born in the ${d}s`, 'Birth decade', `Born from ${d} to ${d + 9}`, (m) => m.bY !== null && m.bY >= d && m.bY <= d + 9, (m) => `${m.lab} was born in ${m.bY}`, [[{ born: `${d}-06-15` }, true], [{ born: `${d + 9}-06-15` }, true], [{ born: `${d - 1}-06-15` }, false], [{ born: `${d + 10}-06-15` }, false]]);
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
MONTHS.forEach((mo, i) => k.when(`${mo} Birthday`, 'Birth month', `Born in ${mo}`, (m) => m.bM === i + 1, (m) => `${m.lab} was born on ${m.born}`,
  [[{ born: `1950-${String(i + 1).padStart(2, '0')}-15` }, true], [{ born: `1950-${String((i + 1) % 12 + 1).padStart(2, '0')}-15` }, false], [{ born: '1950-00-00' }, false], [{ born: null }, false]]));
for (const [nm, md, label] of [['Christmas Birthday', '12-25', 'December 25'], ['New Year Birthday', '01-01', 'January 1'], ['Halloween Birthday', '10-31', 'October 31'], ['Independence Day Birthday', '07-04', 'July 4']]) {
  k.when(nm, 'Birthday date', `Born on ${label}`, (m) => m.bM !== null && m.bD !== null && `${String(m.bM).padStart(2, '0')}-${String(m.bD).padStart(2, '0')}` === md, (m) => `${m.lab} was born on ${m.born}`, [[{ born: `1950-${md}` }, true], [{ born: '1950-06-15' }, false], [{ born: '1950-00-00' }, false]]);
}
for (const [country, nm] of [['USA', 'Born in the USA'], ['United Kingdom', 'Born in the United Kingdom'], ['Germany', 'Born in Germany'], ['France', 'Born in France'], ['Japan', 'Born in Japan'], ['Russia', 'Born in Russia'], ['Sweden', 'Born in Sweden'],
  ['Poland', 'Born in Poland'], ['Switzerland', 'Born in Switzerland'], ['Canada', 'Born in Canada'], ['the Netherlands', 'Born in the Netherlands'], ['Italy', 'Born in Italy'], ['Austria', 'Born in Austria'], ['Norway', 'Born in Norway'],
  ['Denmark', 'Born in Denmark'], ['China', 'Born in China'], ['Hungary', 'Born in Hungary'], ['Australia', 'Born in Australia'], ['Scotland', 'Born in Scotland'], ['Belgium', 'Born in Belgium'], ['South Africa', 'Born in South Africa'],
  ['India', 'Born in India'], ['Spain', 'Born in Spain'], ['Czech Republic', 'Born in the Czech Republic'], ['Egypt', 'Born in Egypt'], ['Ukraine', 'Born in Ukraine'], ['Israel', 'Born in Israel']]) {
  k.is(nm, 'Birth country', 'bcountry', country, `Born, or founded, in ${country} (as the country is named today)`, (m) => `${m.lab}: ${m.bcity ? m.bcity + ', ' : ''}${country}`);
}
for (const cont of ['Europe', 'North America', 'Asia', 'Africa', 'Oceania', 'South America']) k.is(`Born in ${cont}`, 'Birth continent', 'bcont', cont, `Born, or founded, in ${cont}`, (m) => `${m.lab}: ${m.bcity ? m.bcity + ', ' : ''}${m.bcountry}`);
k.when('Changed Borders', 'Birth country change', 'Born in a place whose country has since changed name or borders', (m) => m.bthen !== null, (m) => `${m.lab} was born in ${m.bthen}, now ${m.bcountry}`, [[{ bthen: 'Prussia', bcountry: 'Poland' }, true], [{ bthen: null }, false]]);
k.when('Prize Abroad', 'Prize place', 'Worked, at the time of the prize, in a different country from the one where they were born', (m) => m.abroad, (m) => `${m.lab} was born in ${m.bcountry} and worked in ${m.prizes.flatMap((p) => p.aff).find((a) => a.c && a.c !== m.bcountry).c}`,
  [[{ bcountry: 'Germany', prizes: [P({ aff: [{ n: 'Caltech', c: 'USA' }] })] }, true], [{ bcountry: 'USA', prizes: [P({ aff: [{ n: 'Caltech', c: 'USA' }] })] }, false], [{ bcountry: null, prizes: [P({ aff: [{ n: 'Caltech', c: 'USA' }] })] }, false]]);
for (const inst of ['University of California', 'Harvard University', 'Massachusetts Institute of Technology (MIT)', 'Stanford University', 'University of Chicago', 'California Institute of Technology (Caltech)', 'Columbia University', 'University of Cambridge',
  'Princeton University', 'Howard Hughes Medical Institute', 'Rockefeller University', 'University of Oxford', 'MRC Laboratory of Molecular Biology', 'Yale University', 'Cornell University', 'Harvard Medical School', 'University College',
  'Berlin University', 'University of Heidelberg']) {
  k.when(`At ${inst}`, 'Prize institution', `Affiliated with ${inst} when the prize was awarded`, (m) => m.insts.includes(inst), (m) => `${m.lab} was at ${inst}`, [[only({ aff: [{ n: inst, c: 'USA' }] }), true], [only({ aff: [{ n: 'Elsewhere', c: 'USA' }] }), false], [only({ aff: [] }), false]]);
}
k.when('Unaffiliated Laureate', 'Prize institution count', 'A person with no institution listed for any prize', (m) => !m.org && m.insts.length === 0, (m) => `${m.lab} has no listed affiliation`, [[only({ aff: [] }), true], [only({ aff: [{ n: 'X', c: 'USA' }] }), false], [{ org: true, ...only({ aff: [] }) }, false]]);
k.when('Two Homes', 'Prize institution count', 'Listed with two or more institutions for one prize', (m) => m.prizes.some((p) => p.aff.length >= 2), (m) => `${m.lab} was affiliated with ${m.prizes.find((p) => p.aff.length >= 2).aff.map((a) => a.n).join(' and ')}`,
  [[only({ aff: [{ n: 'A', c: 'USA' }, { n: 'B', c: 'USA' }] }), true], [only({ aff: [{ n: 'A', c: 'USA' }] }), false]]);
// wording of the citation
const cite = (nm, re, text, yes) => k.when(nm, 'Citation wording', `The citation ${text}`, (m) => re.test(m.mot), (m) => `${m.lab}: "${m.motive1}"`, [[only({ motive: yes }), true], [only({ motive: 'for something else entirely' }), false], [only({ motive: null }), false]]);
cite('Discovery Prize', /discover/, 'speaks of a discovery', 'for the discovery of a thing'); cite('Development Prize', /develop/, 'speaks of a development', 'for the development of a method');
cite('Theory Prize', /theor/, 'speaks of a theory', 'for theoretical work'); cite('Peace Efforts Prize', /peace/, 'speaks of peace', 'for their efforts for peace');
cite('Gene Prize', /\bgen(e|es|etic|etics|ome)\b/, 'mentions genes or genetics', 'for work on genes'); cite('Cell Prize', /\bcell/, 'mentions cells', 'for work on the cell');
cite('Quantum Prize', /quantum/, 'mentions quantum physics', 'for quantum states'); cite('Particle Prize', /particle/, 'mentions particles', 'for a new particle');
cite('Economic Analysis Prize', /econom/, 'mentions economics', 'for economic analysis'); cite('Human Rights Prize', /human rights/, 'mentions human rights', 'for human rights');
cite('Poetry Prize', /poet/, 'mentions poetry', 'for poetic work'); cite('War Prize', /\bwar\b|\bwars\b/, 'mentions war', 'for ending a war');
k.when('Short Citation', 'Citation length', 'The first citation is 45 characters or fewer', (m) => m.motive1 !== null && m.motive1.length <= 45, (m) => `"${m.motive1}" is ${m.motive1.length} characters`, [[only({ motive: 'x'.repeat(45) }), true], [only({ motive: 'x'.repeat(46) }), false], [only({ motive: null }), false]]);
k.when('Long Citation', 'Citation length', 'The first citation is 140 characters or more', (m) => m.motive1 !== null && m.motive1.length >= 140, (m) => `"${m.motive1}" is ${m.motive1.length} characters`, [[only({ motive: 'x'.repeat(140) }), true], [only({ motive: 'x'.repeat(139) }), false], [only({ motive: null }), false]]);
// name
k.when('Initials in the Name', 'Name form', 'The name includes an initial, like T. S. Eliot', (m) => /\b[A-Z]\./.test(m.name), (m) => `"${m.name}" includes an initial`, [[{ name: 'T. S. Eliot' }, true], [{ name: 'Marie Curie' }, false]]);
k.when('Hyphenated Name', 'Name form', 'The name contains a hyphen', (m) => m.name.includes('-'), (m) => `"${m.name}" has a hyphen`, [[{ name: 'Jean-Paul Sartre' }, true], [{ name: 'Marie Curie' }, false]]);
k.when('Pen Name', 'Name form', 'Writes under a pen name', (m) => m.pen, (m) => `${m.lab} is a pen name`, [[{ pen: true }, true], [{ pen: false }, false], [{ pen: 'yes' }, false]]);
k.when('Short Name', 'Name length', 'A name of 8 characters or fewer', (m) => m.name.length <= 8, (m) => `"${m.name}" has ${m.name.length} characters`, [[{ name: 'Mo Yan' }, true], [{ name: 'Marie Curie' }, false]]);
k.when('Long Name', 'Name length', 'A name of 25 characters or more', (m) => m.name.length >= 25, (m) => `"${m.name}" has ${m.name.length} characters`, [[{ name: 'x'.repeat(25) }, true], [{ name: 'x'.repeat(24) }, false]]);

export const rules = k.rules, cases = k.cases;
export const RULES = rules;
