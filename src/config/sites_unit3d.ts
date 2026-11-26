
import { SiteConfig, SiteType } from '../types/SiteConfig';

export const Unit3DSites: SiteConfig[] = [
    {
        name: 'BLU',
        type: SiteType.Unit3DClassic,
        keywords: ['blutopia.cc'],
        baseUrl: 'https://blutopia.cc/',
        search: {
            imdb: 'torrents?imdbid={imdbNo}&perPage=25&imdbId={imdbNo}',
            name: 'torrents?search={name}'
        },
        description: 'Blutopia'
    },
    {
        name: 'Tik',
        type: SiteType.Unit3DClassic,
        keywords: ['cinematik.net', 'cinematik.me', 'cinematik.cc'],
        baseUrl: 'https://cinematik.net/',
        contentDomains: ['movie', 'doc'],
        description: 'Cinematik (Tik)'
    },
    {
        name: 'ACM',
        type: SiteType.Unit3DClassic,
        keywords: ['eiga.moi'],
        baseUrl: 'https://eiga.moi/',
        search: { imdb: 'torrents?imdb={imdbNo}#page/1', name: 'torrents?search={name}' },
        description: 'ACM'
    },
    {
        name: 'Monika',
        type: SiteType.Unit3DClassic,
        keywords: ['monikadesign.uk'],
        baseUrl: 'https://monikadesign.uk/',
        // Legacy parity: Monika uses `/upload/1`, not Unit3D `/torrents/create`.
        uploadPath: 'upload/1',
        search: { imdb: 'torrents?imdbId={imdb}#page/1', name: 'torrents?name={name}&sortField=size' },
        description: 'Monika'
    },
    {
        name: 'Aither',
        type: SiteType.Unit3DClassic,
        keywords: ['aither.cc'],
        baseUrl: 'https://aither.cc/',
        description: 'Aither'
    },
    {
        name: 'BHD',
        type: SiteType.BHD,
        keywords: ['beyond-hd.me', 'beyond-hd.xyz', 'beyond-hd.site', 'beyond-hd.io', 'beyond-hd.', 'beyondhd.co', 'beyondhd.'],
        baseUrl: 'https://beyond-hd.me/',
        uploadPath: 'upload',
        search: { imdb: 'torrents?imdb={imdb}', name: 'torrents?search={name}' },
        description: 'Beyond-HD',
        features: {
            imdbSearch: true,
            doubanSearch: false,
        }
    },
    {
        name: 'PrivateHD',
        type: SiteType.Avistaz,
        keywords: ['privatehd.to'],
        baseUrl: 'https://privatehd.to/',
        uploadPath: 'upload/movie',
        search: {
            imdb: 'movies?search=&imdb={imdb}',
            name: 'torrents?in=1&search={name}'
        },
        description: 'PrivateHD'
    },
    {
        name: 'OnlyEncodes',
        type: SiteType.Unit3DClassic,
        keywords: ['onlyencodes.cc'],
        baseUrl: 'https://onlyencodes.cc/',
        experimental: true,
        description: 'OnlyEncodes+'
    },
    {
        name: 'DarkLand',
        type: SiteType.Unit3DClassic,
        keywords: ['darkland.top'],
        baseUrl: 'https://darkland.top/',
        experimental: true,
        description: 'DarkLand'
    },
    {
        name: 'ReelFliX',
        type: SiteType.Unit3DClassic,
        keywords: ['reelflix.cc', 'reelflix.xyz'],
        baseUrl: 'https://reelflix.cc/',
        mirrorUrl: 'https://reelflix.xyz/',
        experimental: true,
        description: 'ReelFliX'
    },
    {
        name: 'HDOli',
        type: SiteType.Unit3DClassic,
        keywords: ['hd-olimpo.club'],
        baseUrl: 'https://hd-olimpo.club/',
        experimental: true,
        description: 'HD-Olimpo'
    },
    {
        name: 'HONE',
        type: SiteType.Unit3DClassic,
        keywords: ['hawke.uno'],
        baseUrl: 'https://hawke.uno/',
        experimental: true,
        capabilities: { source: true, target: false },
        description: 'Hawke-Uno (Source Only)'
    },
    {
        name: 'DesiTorrents',
        type: SiteType.Unit3DClassic,
        keywords: ['desitorrents.tv', 'torrent.desi'],
        baseUrl: 'https://desitorrents.tv/',
        experimental: true,
        description: 'DesiTorrents'
    }
];
