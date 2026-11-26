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
    assert.equal(siteOf('https://backup.landof.tv/torrents.php?id=1&torrentid=2'), 'BTN');
    assert.equal(siteOf('https://www.tlgetin.cc/torrent/12345'), 'TorrentLeech');
    assert.equal(siteOf('https://reelflix.cc/torrents/99'), 'ReelFliX');
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
    assert.equal(isSource('https://broadcasthe.net/torrents.php?id=10&torrentid=20'), true);
    assert.equal(isSource('https://broadcasthe.net/torrents.php?id=10'), false);
    assert.equal(isSource('https://hdroute.org/details.php?id=12345'), true);
    assert.equal(isSource('https://hdroute.org/browse.php'), false);
    assert.equal(isSource('https://filelist.io/details.php?id=999'), true);
    assert.equal(isSource('https://filelist.io/browse.php'), false);
    assert.equal(isSource('https://www.torrentleech.org/torrent/241234'), true);
    assert.equal(isSource('https://www.torrentleech.org/torrents/browse'), false);
    assert.equal(isSource('https://onlyencodes.cc/torrents/123'), true);
    assert.equal(isSource('https://hawke.uno/torrents/123'), true);
});

test('forum threads and other non-torrent pages are not source pages', () => {
    const isSource = (url: string) => SiteRegistry.getEngine(url)!.isSourcePage(new URL(url));
    // Unit3D forums (the forward UI used to appear inside topic posts).
    assert.equal(isSource('https://cinematik.net/forums/topics/24135'), false);
    assert.equal(isSource('https://aither.cc/forums/topics/123?page=2'), false);
    assert.equal(isSource('https://blutopia.cc/forums/threads/5'), false);
    assert.equal(isSource('https://cinematik.net/torrents?imdbId=tt0133093'), false);
    assert.equal(isSource('https://cinematik.net/users/someone'), false);
    // NexusPHP pages that are not a torrent detail.
    assert.equal(isSource('https://hdsky.me/forums.php?action=viewtopic&topicid=1'), false);
    assert.equal(isSource('https://hdsky.me/details.php'), false);
    assert.equal(isSource('https://hdsky.me/userdetails.php?id=1'), false);
    // Still detected.
    assert.equal(isSource('https://cinematik.net/torrents/24135'), true);
    assert.equal(isSource('https://kp.m-team.cc/detail/123'), true);
});
