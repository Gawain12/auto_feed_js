import test from 'node:test';
import assert from 'node:assert/strict';
import { SiteRegistry } from '../src/core/SiteRegistry';
import { SiteCatalogService } from '../src/services/SiteCatalogService';

const siteOf = (url: string) => SiteRegistry.getEngine(url)?.siteName ?? null;

test('every configured site resolves from its own baseUrl', () => {
    for (const site of SiteCatalogService.getAllSites()) {
        if (!site.baseUrl) continue;
        assert.equal(siteOf(`${site.baseUrl}details.php?id=1`), site.name, site.baseUrl);
    }
});

test('mirror domains resolve to the same site', () => {
    assert.equal(siteOf('https://kp.m-team.io/detail/1'), 'MTeam');
    assert.equal(siteOf('https://ptchdbits.co/details.php?id=1'), 'CHDBits');
    assert.equal(siteOf('https://hdts.ru/details.php?id=1'), 'HDT');
    assert.equal(siteOf('https://beyond-hd.me/torrents/x.1'), 'BHD');
});

test('a tracker domain in the query string does not select that tracker', () => {
    assert.equal(siteOf('https://pixhost.to/show/1?ref=hdbits.org'), null);
    assert.equal(siteOf('https://hdsky.me/torrents.php?search=chdbits.co'), 'HDSky');
});

test('source-page detection per engine', () => {
    const isSource = (url: string) => SiteRegistry.getEngine(url)!.isSourcePage(new URL(url));
    assert.equal(isSource('https://totheglory.im/t/123/'), true);
    assert.equal(isSource('https://passthepopcorn.me/torrents.php?id=1'), true);
    assert.equal(isSource('https://passthepopcorn.me/torrents.php?searchstr=x'), false);
    assert.equal(isSource('https://greatposterwall.com/torrents.php?id=1'), false);
    assert.equal(isSource('https://greatposterwall.com/torrents.php?id=1&torrentid=2'), true);
    assert.equal(isSource('https://karagarga.in/userdetails.php?id=1'), false);
    assert.equal(isSource('https://karagarga.in/reqdetails.php?id=1'), true);
    assert.equal(isSource('https://hdsky.me/details.php?id=1'), true);
    assert.equal(isSource('https://hdsky.me/torrents.php'), false);
    assert.equal(isSource('https://blutopia.cc/torrents/123'), true);
});
