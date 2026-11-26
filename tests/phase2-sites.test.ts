import test from 'node:test';
import assert from 'node:assert/strict';
import { SiteCatalogService } from '../src/services/SiteCatalogService';
import { SiteRegistry } from '../src/core/SiteRegistry';
import { ForwardLinkService } from '../src/services/ForwardLinkService';
import { buildDoubanFormat } from '../src/services/PtgenService';
import { TorrentMeta } from '../src/types/TorrentMeta';

test('Phase 2 sites are registered with expected capabilities and engines', () => {
    const sites = new Map(SiteCatalogService.getAllSites().map((s) => [s.name, s]));

    // Source-only sites must mark target: false so they do not appear in forward target bar.
    for (const name of ['FileList', 'TorrentLeech', 'HONE', 'HHClub']) {
        const cfg = sites.get(name);
        assert.ok(cfg, `Missing site config: ${name}`);
        assert.equal(cfg.capabilities?.target, false, `${name} should be source-only`);
    }

    // Bidirectional sites must remain target-capable.
    for (const name of ['BTN', 'HDRoute', 'OnlyEncodes', 'DarkLand', 'ReelFliX', 'FNP', 'HDOli', 'DesiTorrents']) {
        const cfg = sites.get(name);
        assert.ok(cfg, `Missing site config: ${name}`);
        assert.notEqual(cfg.capabilities?.target, false, `${name} should support target`);
    }

    assert.equal(SiteRegistry.getEngine('https://broadcasthe.net/upload.php')?.siteName, 'BTN');
    assert.equal(SiteRegistry.getEngine('https://hdroute.org/upload.php')?.siteName, 'HDRoute');
    assert.equal(SiteRegistry.getEngine('https://onlyencodes.cc/torrents/create')?.siteName, 'OnlyEncodes');
    assert.equal(SiteRegistry.getEngine('https://darkland.top/torrents/create')?.siteName, 'DarkLand');
});

test('TorrentLeech respects tlBaseUrl option when building search links', () => {
    (globalThis as any).window = { location: { host: 'example.org', protocol: 'https:', href: 'https://example.org/' } };
    const tl = SiteCatalogService.getAllSites().find((s) => s.name === 'TorrentLeech')!;
    const meta: TorrentMeta = {
        title: 'The.Matrix.1999.1080p.BluRay.x264-FGT',
        imdbId: 'tt0133093',
        description: '',
        images: [],
        sourceSite: 'PTP',
        sourceUrl: 'https://passthepopcorn.me/torrents.php?id=1'
    };
    assert.equal(
        ForwardLinkService.getSearchUrl(tl, meta, { tlBaseUrl: 'https://www.tlgetin.cc/' }),
        'https://www.tlgetin.cc/torrents/browse/index/query/tt0133093'
    );
});

test('buildDoubanFormat outputs complete legacy-style BBCode block', () => {
    const bbcode = buildDoubanFormat({
        id: '1316560',
        title: '列宁格勒牛仔征美记',
        originalTitle: 'Leningrad Cowboys Go America',
        image: 'https://img2.doubanio.com/view/photo/l_ratio_poster/public/p1.jpg',
        year: 1989,
        region: '芬兰 / 瑞典',
        genre: '喜剧 / 音乐',
        language: '英语 / 芬兰语',
        releaseDate: '1989-03-24',
        imdbId: 'tt0097728',
        average: '8.3',
        votes: '5123',
        runtime: '79分钟',
        director: '阿基·考里斯马基',
        writer: '阿基·考里斯马基',
        cast: '马蒂·佩龙帕 / 卡里·瓦纳宁',
        summary: '摇滚乐队赴美巡演的故事。',
        awards: ['第40届柏林国际电影节 最佳影片(提名)']
    });

    assert.match(bbcode, /^\[img\]https:\/\/img2\.doubanio\.com\/view\/photo\/l_ratio_poster\/public\/p1\.jpg\[\/img\]/);
    assert.match(bbcode, /◎译　　名　列宁格勒牛仔征美记/);
    assert.match(bbcode, /◎片　　名　Leningrad Cowboys Go America/);
    assert.match(bbcode, /◎产　　地　芬兰 \/ 瑞典/);
    assert.match(bbcode, /◎编　　剧　阿基·考里斯马基/);
    assert.match(bbcode, /◎豆瓣评分　8\.3\/10 from 5123 users/);
    assert.match(bbcode, /◎豆瓣链接　https:\/\/movie\.douban\.com\/subject\/1316560\//);
    assert.match(bbcode, /◎IMDb链接.*https:\/\/www\.imdb\.com\/title\/tt0097728\//);
    assert.match(bbcode, /◎简　　介/);
    assert.match(bbcode, /◎获奖情况\n\n　　第40届柏林国际电影节 最佳影片\(提名\)/);
});
