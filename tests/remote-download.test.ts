import test from 'node:test';
import assert from 'node:assert/strict';
import {
    extractDownloadTorrentId,
    extractPageTorrentId,
    isSameTorrentPageUrl,
    looksLikeTorrentBytes
} from '../src/common/rules/remoteDownload';
import { SiteRegistry } from '../src/core/SiteRegistry';

test('extractDownloadTorrentId supports both Gazelle action=download&id and torrentid URLs', () => {
    assert.equal(
        extractDownloadTorrentId('https://greatposterwall.com/torrents.php?action=download&id=123456&authkey=abc&torrent_pass=xyz'),
        '123456'
    );
    assert.equal(
        extractDownloadTorrentId('torrents.php?id=98765&action=download&usetoken=0'),
        '98765'
    );
    assert.equal(
        extractDownloadTorrentId('https://redacted.sh/torrents.php?action=download&id=55555&authkey=a'),
        '55555'
    );
    assert.equal(
        extractDownloadTorrentId('https://passthepopcorn.me/torrents.php?action=download&id=44444&torrentid=44444'),
        '44444'
    );
    assert.equal(
        extractDownloadTorrentId('https://hdsky.me/download.php?id=77777'),
        '77777'
    );
    assert.equal(extractDownloadTorrentId('https://example.com/torrents.php'), '');
});

test('extractPageTorrentId reads torrentid query param cleanly', () => {
    assert.equal(
        extractPageTorrentId('https://greatposterwall.com/torrents.php?id=100&torrentid=200#torrent200'),
        '200'
    );
    assert.equal(
        extractPageTorrentId('https://greatposterwall.com/torrents.php?id=100'),
        ''
    );
});

test('isSameTorrentPageUrl rejects stale cache from other pages or torrentids', () => {
    assert.equal(
        isSameTorrentPageUrl(
            'https://greatposterwall.com/torrents.php?id=100&torrentid=200',
            'https://greatposterwall.com/torrents.php?id=100&torrentid=200#torrent200'
        ),
        true
    );
    assert.equal(
        isSameTorrentPageUrl(
            'https://greatposterwall.com/torrents.php?id=100&torrentid=200',
            'https://greatposterwall.com/torrents.php?id=100&torrentid=201'
        ),
        false
    );
    assert.equal(
        isSameTorrentPageUrl(
            'https://hdsky.me/details.php?id=111',
            'https://greatposterwall.com/torrents.php?id=111&torrentid=222'
        ),
        false
    );
    assert.equal(
        isSameTorrentPageUrl(
            'https://kp.m-team.cc/detail/100',
            'https://kp.m-team.cc/detail/101'
        ),
        false
    );
});

test('looksLikeTorrentBytes accepts bencoded torrents and rejects HTML error pages', () => {
    const valid = new TextEncoder().encode('d8:announce35:https://tracker.example/announce4:infod4:name4:testee');
    const html = new TextEncoder().encode('<!DOCTYPE html><html><body>Login required</body></html>');
    const short = new TextEncoder().encode('d1:a1:be');
    assert.equal(looksLikeTorrentBytes(valid), true);
    assert.equal(looksLikeTorrentBytes(html), false);
    assert.equal(looksLikeTorrentBytes(short), false);
});

test('PrivateHD singular /torrent/ detail URL is recognized as a source page', () => {
    const engine = SiteRegistry.getEngine('https://privatehd.to/torrent/12345-example-movie');
    assert.equal(engine?.siteName, 'PrivateHD');
    assert.equal(engine?.isSourcePage(new URL('https://privatehd.to/torrent/12345-example-movie')), true);
    assert.equal(engine?.isSourcePage(new URL('https://privatehd.to/torrents')), false);
});
