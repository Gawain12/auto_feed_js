// Snapshot of every configured site's upload / dupe-search URL.
// A diff here means a target link changed: check it is intended, then refresh with
//   UPDATE_SNAPSHOTS=1 npm test -- forward-links
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ForwardLinkService, ForwardLinkOptions } from '../src/services/ForwardLinkService';
import { SiteCatalogService } from '../src/services/SiteCatalogService';
import { TorrentMeta } from '../src/types/TorrentMeta';

const SNAPSHOT = path.resolve(process.cwd(), 'tests/fixtures/forward-links.snapshot.txt');

const METAS = [
    { title: 'The.Matrix.1999.1080p.BluRay.x264-FGT', imdbId: 'tt0133093' },
    { title: 'Breaking Bad S01 1080p BluRay', imdbUrl: 'https://www.imdb.com/title/tt0903747/' },
    { title: 'No Imdb Movie 2020 1080p WEB-DL' }
].map((m) => ({ description: '', images: [], sourceSite: '', sourceUrl: '', ...m }) as TorrentMeta);

const OPTION_SETS: (ForwardLinkOptions | undefined)[] = [undefined, { chdBaseUrl: 'https://ptchdbits.co', tlBaseUrl: 'https://tl.example/' }];

function render(host: string): string[] {
    (globalThis as any).window = { location: { host, protocol: 'https:', href: `https://${host}/` } };
    const lines: string[] = [];
    for (const options of OPTION_SETS) {
        for (const site of SiteCatalogService.getAllSites()) {
            lines.push(`${site.name} upload ${ForwardLinkService.getUploadUrl(site, options)}`);
            METAS.forEach((meta, i) => lines.push(`${site.name} search${i} ${ForwardLinkService.getSearchUrl(site, meta, options)}`));
        }
    }
    return lines;
}

test('forward upload/search URLs match the snapshot', () => {
    const lines = [
        ...render('example.org'),
        // Sites with `preferCurrentHost` link to the mirror the user is on.
        ...render('kp.m-team.io').filter((l) => l.startsWith('MTeam ')).map((l) => `[on kp.m-team.io] ${l}`)
    ];
    const actual = `${lines.join('\n')}\n`;
    if (process.env.UPDATE_SNAPSHOTS) writeFileSync(SNAPSHOT, actual);
    assert.equal(actual, readFileSync(SNAPSHOT, 'utf8'));
});
