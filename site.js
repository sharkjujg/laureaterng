// Everything specific to LaureateRNG: names, copy, card art, and which facts the result card shows. app.js is generic.
import { esc, fmt, hash, rng, band } from './kit.js';

const unknown = 'not in the API';
const FIELD = { Physics: 'Physics', Chemistry: 'Chemistry', 'Physiology or Medicine': 'Physiology or Medicine', Literature: 'Literature', Peace: 'Peace', 'Economic Sciences': 'Economic Sciences' };
const HUE = { Physics: 215, Chemistry: 150, 'Physiology or Medicine': 350, Literature: 38, Peace: 190, 'Economic Sciences': 268 };
const SHARE = { 1: 'the whole prize', '1/2': 'half a prize', '1/3': 'a third of a prize', '1/4': 'a quarter of a prize' };
const when = (m) => (m.born ? (m.born.endsWith('-00-00') ? m.born.slice(0, 4) : m.born.endsWith('-00') ? m.born.slice(0, 7) : m.born) : unknown);
const place = (city, country, then) => [city, country].filter(Boolean).join(', ') + (then ? ` (then ${then})` : '');
const tally = (pool, get) => { const c = new Map(); for (const m of pool.members) for (const v of get(m)) c.set(v, (c.get(v) || 0) + 1); return [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); };

export default {
  key: 'laureaterng',
  name: 'LaureateRNG',
  pageTitle: 'LaureateRNG: a daily prize-laureate discovery game',
  noun: 'laureate', nouns: 'laureates', thing: 'Laureate',
  worldNote: 'every prize laureate',
  repo: 'https://github.com/sharkjujg/laureaterng',
  headline: 'Discover a laureate. Once a day.',
  intro: (n) => `Roll once to meet one laureate of the Nobel Prizes, drawn from every person and organization on the official list: <b>${fmt(n)}</b> of them. Everyone has the same 1-in-${fmt(n)} chance, famous or little known. Badges explain what is unusual about the prize and its place and date, and rarer badges earn more rarity points (RP). The daily limit resets at 00:00 UTC.`,
  notice: 'Prototype: every laureate and prize is real (the Nobel Prize API, CC0), but there are no photos or accounts yet, and your results are saved only in this browser. This is an unofficial fan project, not affiliated with or endorsed by Nobel Prize Outreach. <a href="#/about">What that means</a>',
  findHint: 'Marie Curie, Einstein, Mandela, Tu…',
  header: (m) => ({ title: m.lab, sub: `${m.org ? 'Organization' : 'Laureate'} · ${[...m.cats].join(' and ')} · ${[...new Set(m.years)].join(' and ')}` }),
  label: (m) => m.lab,
  shelves: (m) => [
    ...[...m.cats].map((c) => ['Prize field', `${c} laureates`]),
    ...(m.first ? [['Prize decade', `Laureates of the ${Math.floor(m.first.y / 10) * 10}s`]] : []),
    ...(m.first?.share ? [['Prize share', `Laureates who received ${SHARE[m.first.share] ?? m.first.share}`]] : []),
    ...(m.bcountry ? [['Birth country', `Laureates born in ${m.bcountry}`]] : []), ...(m.bcont ? [['Birth continent', `Laureates born in ${m.bcont}`]] : []),
    ...(m.bY !== null ? [['Birth decade', `Laureates born in the ${Math.floor(m.bY / 10) * 10}s`]] : []),
    ...(m.age1 !== null ? [['Prize age', 'Laureates ' + band(m.age1, [[40, 'under 40 at the prize'], [60, 'aged 40 to 59 at the prize'], [70, 'aged 60 to 69 at the prize'], [Infinity, 'aged 70 or more at the prize']])]] : []),
    ...m.insts.map((i) => ['Prize institution', `Laureates at ${i}`]),
    ...(m.name ? [['Name start', `Laureates whose name starts with ${m.name.replace(/^[^A-Za-zÀ-ž]+/, '')[0]?.toUpperCase() ?? '#'}`]] : []),
  ],
  facts: (m) => [
    ['Kind', m.org ? 'Organization' : 'Person'],
    ['Prizes', m.prizes.map((p) => `${p.cat} ${p.y}${p.share ? `, ${SHARE[p.share] ?? p.share}` : ''}${p.status && p.status !== 'received' ? ` (${p.status})` : ''}`).join('; ')],
    ['Citation', m.prizes.map((p) => (p.motive ? `“${p.motive}”` : unknown)).join(' · ')],
    [m.org ? 'Founded' : 'Born', `${when(m)}${m.bcity || m.bcountry ? `, ${place(m.bcity, m.bcountry, m.bthen)}` : ''}`],
    ...(m.org ? [] : [['Died', m.died ? `${m.died.endsWith('-00-00') ? m.died.slice(0, 4) : m.died}${m.dcountry ? `, ${m.dcountry}` : ''}` : 'no death recorded'], ['Age at the first prize', m.age1 !== null ? `${m.age1}` : unknown], ['Age at death', m.life !== null ? `${m.life}` : 'not applicable']]),
    ['Affiliation at the prize', m.insts.length ? m.insts.join('; ') : 'none listed'],
    ['Source', 'Nobel Prize API (CC0)', `https://www.nobelprize.org/laureate/${encodeURIComponent(m.id)}`],
  ],
  art(m) { // original picture: a laurel wreath around a symbol of the prize field. Not a medal, a portrait or a logo; never affects scoring.
    const h = hash(m.id), rnd = rng(h), cat = m.first?.cat ?? 'Peace', hue = HUE[cat] ?? 200, c = `hsl(${hue} 70% 62%)`, soft = `hsl(${hue} 60% 30%)`;
    const leaf = (i, n) => { const a = (i / n) * Math.PI * 2, x = 50 + 37 * Math.cos(a), y = 50 + 37 * Math.sin(a); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.6" ry="2.2" fill="hsl(46 70% ${52 + rnd() * 10}%)" opacity=".85" transform="rotate(${(a * 180 / Math.PI + 90 + (i % 2 ? 28 : -28)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; };
    const wreath = Array.from({ length: 22 }, (_, i) => leaf(i, 22)).join('');
    const icons = {
      Physics: `<g fill="none" stroke="${c}" stroke-width="1.6">${[0, 60, 120].map((r) => `<ellipse cx="50" cy="50" rx="19" ry="7.5" transform="rotate(${r} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="3.4" fill="#fff"/>`,
      Chemistry: `<path d="M44 33h12v11l9 17a4.5 4.5 0 0 1-4 6.5H39a4.5 4.5 0 0 1-4-6.5l9-17z" fill="${soft}" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/><path d="M38 60h24l3 5.5H35z" fill="${c}" opacity=".7"/><circle cx="47" cy="54" r="1.6" fill="#fff"/><circle cx="53" cy="49" r="1.2" fill="#fff"/>`,
      'Physiology or Medicine': `<path d="${Array.from({ length: 21 }, (_, i) => `${i ? 'L' : 'M'}${(40 + Math.sin(i / 3) * 9).toFixed(1)} ${(32 + i * 1.8).toFixed(1)}`).join('')}" fill="none" stroke="${c}" stroke-width="1.8"/><path d="${Array.from({ length: 21 }, (_, i) => `${i ? 'L' : 'M'}${(60 - Math.sin(i / 3) * 9).toFixed(1)} ${(32 + i * 1.8).toFixed(1)}`).join('')}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.8"/>${Array.from({ length: 8 }, (_, i) => `<line x1="${(40 + Math.sin((i * 2.6 + 1) / 3) * 9).toFixed(1)}" y1="${(32 + (i * 2.6 + 1) * 1.8).toFixed(1)}" x2="${(60 - Math.sin((i * 2.6 + 1) / 3) * 9).toFixed(1)}" y2="${(32 + (i * 2.6 + 1) * 1.8).toFixed(1)}" stroke="${c}" stroke-opacity=".6" stroke-width=".9"/>`).join('')}`,
      Literature: `<path d="M50 40c-6-4-14-4-20-1v26c6-3 14-3 20 1zM50 40c6-4 14-4 20-1v26c-6-3-14-3-20 1z" fill="${soft}" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 40v26" stroke="${c}" stroke-width="1.2"/><path d="M36 48c4-1 8-1 10 0M36 53c4-1 8-1 10 0M54 48c2-1 6-1 10 0M54 53c2-1 6-1 10 0" stroke="#fff" stroke-opacity=".6" stroke-width=".9" fill="none"/>`,
      Peace: `<path d="M34 64c10-2 18-8 30-26" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>${[[40, 61, -40], [46, 57, -50], [52, 52, -55], [58, 46, -60], [44, 62, 30], [52, 58, 25], [59, 52, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.2" fill="${c}" opacity=".85" transform="rotate(${r} ${x} ${y})"/>`).join('')}`,
      'Economic Sciences': `<g fill="${soft}" stroke="${c}" stroke-width="1.4">${[[34, 56, 8], [44, 49, 15], [54, 42, 22], [64, 35, 29]].map(([x, y, hh]) => `<rect x="${x - 3.5}" y="${y + 8 - hh / 2 + 4}" width="7" height="${hh}" rx="1"/>`).join('')}</g><path d="M32 52L45 45L55 38L68 30" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
    };
    return `<svg class="avatar" viewBox="0 0 100 100" role="img" aria-label="Generated picture: a laurel wreath around a symbol for the prize field. Not a medal or a portrait.">
      <rect width="100" height="100" rx="8" fill="hsl(${hue} 45% 9%)"/><circle cx="50" cy="50" r="30" fill="hsl(${hue} 50% 14%)" stroke="hsl(${hue} 60% 40%)" stroke-width=".8"/>${wreath}${icons[cat] ?? icons.Peace}
      <text x="50" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="5.5" letter-spacing=".6" fill="#8791b8">GENERATED IMAGE</text></svg>`;
  },
  poolNotice: 'Every record comes from the official list of prize laureates in the Nobel Prize API, as a snapshot: every person and every organization that has been awarded a prize, with their prizes, citations, birth or founding place and date, and affiliation at the time. Nobody is left out. A value the API lacks is shown as unknown and never earns a badge. Odds describe this list of about a thousand laureates, which leans toward physics, medicine and chemistry, toward the United States and Europe, and toward people who were still working when the prize came.',
  poolExtra(pool) {
    const table = (title, rows, head = 'Laureates') => `<table><thead><tr><th>${esc(title)}</th><th class="n">${head}</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${fmt(v)}</td></tr>`).join('')}</tbody></table>`;
    return `<h2>What is in the pool</h2><p class="small muted">Disclosed because a badge is only rare relative to this mix.</p>
      ${table('Prize field', tally(pool, (m) => [...m.cats]), 'Laureates')}${table('Birth continent', tally(pool, (m) => (m.bcont ? [m.bcont] : [])))}${table('Born in (top 10)', tally(pool, (m) => (m.bcountry ? [m.bcountry] : [])).slice(0, 10))}${table('Prize share', tally(pool, (m) => [...new Set(m.prizes.map((p) => SHARE[p.share] ?? p.share))]))}`;
  },
  aboutData: `<h2>Where the data comes from</h2>
    <p>Every field comes from the <a href="https://www.nobelprize.org/about/terms-of-use-for-api-nobelprize-org-and-data-nobelprize-org/">Nobel Prize API</a> (version 2.1), which Nobel Prize Outreach publishes under the Creative Commons Zero (CC0) licence, fetched once as a snapshot: name, prizes (year, field, share, citation, status), birth or founding date and place, death date, and the institutions listed for each prize. Dates the API gives only to the year or month are kept that way, and a missing month or day never earns a badge. "Born in" uses today's country for the birthplace and notes a changed name or border; an organization's "born" is where and when it was founded. The affiliation is the one at the time of the prize, so "Prize Abroad" means that country differs from the birth country. Ages are whole years from the birth date to the date the prize was awarded (to the year, where the birth date is only a year). The citation is the official text. Gender is in the API but no badge uses it: the data's terms ask that it is not used to discredit or discriminate, so badges describe the prize, the place and the wording. The artwork is a generated drawing, not a medal, a portrait or a logo.</p>`,
  terms: 'It is not affiliated with, sponsored or endorsed by Nobel Prize Outreach or the Nobel Foundation, and it does not use their name or marks in its title or logo. The data is not altered or left out; any errors in the badges are this prototype\'s. Badges describe facts about the award, not merit.',
};
