import { SiteConfig, SiteType } from '../types/SiteConfig';

// Site-specific/non-framework trackers. Keep them out of Nexus/Gazelle/Unit3D
// buckets so future adapter work has an obvious home.
export const SpecialSites: SiteConfig[] = [
    {
        name: 'HDB',
        type: SiteType.HDB,
        keywords: ['hdbits.org'],
        baseUrl: 'https://hdbits.org/',
        uploadPath: 'upload',
        search: { imdb: 'browse.php?search={imdb}', name: 'browse.php?search={name}' },
        description: 'HDBits'
    },
    {
        name: 'KG',
        type: SiteType.KG,
        keywords: ['karagarga.in'],
        baseUrl: 'https://karagarga.in/',
        contentDomains: ['movie', 'doc'],
        search: { imdb: 'browse.php?search={imdb}&search_type=imdb', name: 'browse.php?search={name}' },
        description: 'Karagarga'
    },
    {
        name: 'HDT',
        type: SiteType.HDT,
        keywords: ['hd-torrents.org', 'hdts.ru'],
        baseUrl: 'https://hd-torrents.org/',
        search: {
            imdb: 'torrents.php?search={imdb}&options=2&order=size&by=DESC',
            name: 'torrents.php?search={name}&options=3&order=size&by=DESC'
        },
        mirrorUrl: 'https://hdts.ru/',
        description: 'HD-Torrents'
    },
    {
        name: 'HDRoute',
        type: SiteType.HDRoute,
        keywords: ['hdroute.org'],
        baseUrl: 'http://hdroute.org/',
        uploadPath: 'upload.php',
        search: {
            imdb: 'browse.php?s={name}&dp=0&add=0&action=s&or=1&imdb={imdbNo}',
            name: 'browse.php?s={name}&dp=0&add=0&action=s&or=1&imdb='
        },
        isChinese: true,
        experimental: true,
        description: 'HDRoute'
    },
    {
        name: 'FileList',
        type: SiteType.FileList,
        keywords: ['filelist.io'],
        baseUrl: 'https://filelist.io/',
        search: {
            imdb: 'browse.php?search={imdb}',
            name: 'browse.php?search={name}'
        },
        capabilities: { source: true, target: false },
        description: 'FileList (Source Only)'
    },
    {
        name: 'TorrentLeech',
        type: SiteType.TorrentLeech,
        keywords: ['torrentleech.org', 'torrentleech.me', 'torrentleech.cc', 'tlgetin.cc'],
        baseUrl: 'https://www.torrentleech.org/',
        baseUrlSetting: 'tlBaseUrl',
        preferCurrentHost: true,
        search: {
            imdb: 'torrents/browse/index/query/{imdb}',
            name: 'torrents/browse/index/query/{name}'
        },
        capabilities: { source: true, target: false },
        description: 'TorrentLeech (Source Only)'
    },
    {
        name: 'AvistaZ',
        type: SiteType.Avistaz,
        keywords: ['avistaz.to'],
        baseUrl: 'https://avistaz.to/',
        uploadPath: 'upload/movie',
        search: {
            imdb: 'movies?search=&imdb={imdb}',
            name: 'torrents?in=1&search={name}'
        },
        description: 'AvistaZ (AVZ)'
    },
    {
        name: 'CinemaZ',
        type: SiteType.Avistaz,
        keywords: ['cinemaz.to'],
        baseUrl: 'https://cinemaz.to/',
        uploadPath: 'upload/movie',
        experimental: true,
        search: {
            imdb: 'movies?search=&imdb={imdb}',
            name: 'torrents?in=1&search={name}'
        },
        description: 'CinemaZ (CNZ)'
    },
    {
        name: 'CG',
        type: SiteType.CG,
        keywords: ['cinemageddon.net'],
        baseUrl: 'https://cinemageddon.net/',
        uploadPath: 'upload.php',
        contentDomains: ['movie', 'doc'],
        search: {
            imdb: 'browse.php?search={imdb}&proj=0&descr=1',
            name: 'browse.php?search={name}&proj=0&descr=1'
        },
        description: 'Cinemageddon (CG)'
    },
    {
        name: 'bib',
        type: SiteType.General,
        keywords: ['bibliotik.me'],
        baseUrl: 'https://bibliotik.me/',
        contentDomains: ['book'],
        capabilities: { source: true, target: false },
        features: { imdbSearch: false, doubanSearch: false },
        description: 'Bibliotik (Source-only)'
    },
    {
        name: 'IPT',
        type: SiteType.General,
        keywords: ['iptorrents.com'],
        baseUrl: 'https://iptorrents.com/',
        capabilities: { source: true, target: false },
        experimental: true,
        search: {
            imdb: 't?q={imdb}',
            name: 't?q={name}'
        },
        description: 'IPTorrents (Source-only)'
    },
    {
        name: 'bit-hdtv',
        type: SiteType.General,
        keywords: ['bit-hdtv.com'],
        baseUrl: 'https://www.bit-hdtv.com/',
        capabilities: { source: true, target: false },
        experimental: true,
        description: 'BIT-HDTV (Source-only)'
    },
    {
        name: 'BlueBird',
        type: SiteType.General,
        keywords: ['bluebird-hd.org'],
        baseUrl: 'https://bluebird-hd.org/',
        capabilities: { source: true, target: false },
        experimental: true,
        description: 'BlueBird (Source-only)'
    },
    {
        name: 'bwtorrents',
        type: SiteType.General,
        keywords: ['bwtorrents.tv'],
        baseUrl: 'https://bwtorrents.tv/',
        capabilities: { source: true, target: false },
        experimental: true,
        description: 'BWTorrents (Source-only)'
    },
    {
        name: 'digitalcore',
        type: SiteType.General,
        keywords: ['digitalcore.club'],
        baseUrl: 'https://digitalcore.club/',
        capabilities: { source: true, target: false },
        experimental: true,
        description: 'DigitalCore (Source-only)'
    },
    {
        name: 'HDSpace',
        type: SiteType.General,
        keywords: ['hd-space.org'],
        baseUrl: 'https://hd-space.org/',
        uploadPath: 'index.php?page=upload',
        experimental: true,
        search: {
            imdb: 'index.php?page=torrents&search={imdbNo}&active=1&options=2',
            name: 'index.php?page=torrents&search={name}&active=1&options=0'
        },
        description: 'HD-Space'
    },
    {
        name: 'iTS',
        type: SiteType.General,
        keywords: ['shadowthein.net'],
        baseUrl: 'https://shadowthein.net/',
        capabilities: { source: true, target: false },
        experimental: true,
        description: 'iTS (Source-only)'
    },
    {
        name: 'ZHUQUE',
        type: SiteType.General,
        keywords: ['zhuque.in'],
        baseUrl: 'https://zhuque.in/',
        uploadPath: 'torrent/upload',
        isChinese: true,
        experimental: true,
        description: '朱雀 (ZHUQUE)'
    },
    {
        name: 'YemaPT',
        type: SiteType.General,
        keywords: ['yemapt.org'],
        baseUrl: 'https://www.yemapt.org/',
        mirrorUrl: 'https://www1.yemapt.org/',
        preferCurrentHost: true,
        uploadPath: '#/torrent/add',
        isChinese: true,
        experimental: true,
        description: '野马 (YemaPT)'
    },
    {
        name: 'RouSi',
        type: SiteType.General,
        keywords: ['rousi.pro', 'rousi.zip'],
        baseUrl: 'https://rousi.pro/',
        preferCurrentHost: true,
        uploadPath: 'upload',
        isChinese: true,
        experimental: true,
        description: '肉丝 (RouSi)'
    }
];
