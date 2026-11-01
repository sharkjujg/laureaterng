# LaureateRNG

A daily laureate discovery game: roll once per UTC day, draw one real prize laureate from the official list (every person and organization ever awarded a Nobel Prize: 1,028 of them), and see which of 145 badges make the prize, the place or the date unusual. A sibling of CinemaRNG, Spacedle, ArtRNG and the other games on the same engine.

**This is a prototype.** Laureate facts are a snapshot of the Nobel Prize API (version 2.1), taken 2026-11-01. There is no backend, so results live in the player's browser. No photographs, portraits or medals are used: the picture is a generated laurel wreath around a symbol of the prize field, labelled as generated. Unofficial fan project, not affiliated with, sponsored or endorsed by Nobel Prize Outreach or the Nobel Foundation.

## Data and licence

The API's [terms of use](https://www.nobelprize.org/about/terms-of-use-for-api-nobelprize-org-and-data-nobelprize-org/) (read in full when this was built) say the services are free to use under **CC0**, and ask for four things, each of which shapes this project:

- *Do not deliberately alter or censor the data.* Every laureate in the API is in the pool: 1,000 people and 28 organizations, 1,036 prizes between them. Nothing is dropped for being awkward (two prizes were declined, one is marked restricted, and those are in).
- *Do not use the data to discredit people or be malicious or discriminatory.* Gender is in the API but is not carried into the pool, and no badge uses it or ranks people by nationality. Badges describe the prize, places, dates and the wording of the citation. The README and About page say this.
- *Use a local cache, not many calls.* `tools/build_pool.py` makes one request (3.9 MB) and keeps the response in a cache file; the site itself never calls the API.
- *Do not use Nobel Prize Outreach's name, logos or marks in titles or logos, or in a way that implies endorsement.* The game is named LaureateRNG, the page title and header avoid the mark, no logo or medal is imitated, and the footer and About page say it is unofficial. The prize's name appears only where it describes the data source. The API terms encourage citing the service as the data source, which the site does.

Field notes: a birthplace uses today's country and notes a changed name or border ("born in Prussia, now Germany"); an organization's "born" is where and when it was founded; dates the API gives only to the year or month stay that way, and a missing month or day never earns a badge; age at the prize is in whole years from the birth date to the date awarded (to the year where the birth date is only a year); the affiliation is the one at the time of the prize.

## What is built

| Area | Status |
| --- | --- |
| Daily roll, unbiased secure draw, one per UTC day, retry-safe | Done, browser-local (the day comes from the host's `Date` header, not the device clock) |
| 145 badge rules, families, RP = 100 / p, rarity tiers, tie rules | Done; every rule's fixtures sit beside it in `rules.js` (built with `kit.js`); `check.html` fails if any badge matches nobody or any laureate earns none |
| Animated reveal, badges appearing worst to best, reduced-motion aware | Done |
| 1,674 achievements derived from your rolls, goals scaled to the pool | Done (`achievements.js`) |
| Find any laureate by name (`#/find`), badge catalog, badge pages, levels, history, export, delete, pool page | Done |
| Sign-in, ranked limit, leaderboards, friends | Needs a server (see `rng-accounts`); the client is present but switched off |

## Run it

No build step.

```
python -m http.server 8784
```

Open <http://localhost:8784>. Open `/check.html` for the self-check; its title becomes `PASS` or `FAIL n`.

## Layout

- `engine.js`, `achievements.js`, `app.js`, `account*.js`, `style.css` are the shared RNG-game files.
- `rules.js` has this game's record preparation and badge rules (each with its fixtures, using the helpers in `kit.js`); `site.js` its copy, art and shelves; `fixtures.js` gathers the cases and holds the pool checks (shares of a prize add to at most one, nobody dies before birth, ids ascend, no gender field in the pool).
- `data/pool-v1.json` is the published pool (about 0.45 MB); `tools/build_pool.py` rebuilds it, `tools/test_import.py` checks the conversion.

## Privacy

No accounts, cookies, analytics or tracking. Rolls stay in the browser's local storage; export or delete them on My rolls. GitHub Pages, which hosts the site, may log requests under GitHub's own privacy policy.
