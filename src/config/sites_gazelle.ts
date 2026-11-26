
import { SiteConfig, SiteType } from '../types/SiteConfig';

export const GazelleSites: SiteConfig[] = [
    {
        name: 'GPW',
        type: SiteType.Gazelle,
        keywords: ['greatposterwall.com'],
        baseUrl: 'https://greatposterwall.com/',
        contentDomains: ['movie'],
        description: 'GreatPosterWall'
    },
    {
        name: 'SC',
        type: SiteType.Gazelle,
        keywords: ['secret-cinema.pw'],
        baseUrl: 'https://secret-cinema.pw/',
        contentDomains: ['movie'],
        search: {
            imdb: 'torrents.php?action=advanced&searchsubmit=1&filter_cat=1&cataloguenumber={imdb}',
            name: 'torrents.php?searchstr={name}'
        },
        groupUpload: true,
        description: 'Secret Cinema'
    },
    {
        name: 'PTP',
        // PTP is a Gazelle (GZ) site. Keep a dedicated engine type for PTP-specific logic,
        // but group/configure it under the Gazelle site list for settings parity.
        type: SiteType.PTP,
        keywords: ['passthepopcorn.me'],
        baseUrl: 'https://passthepopcorn.me/',
        contentDomains: ['movie', 'miniseries', 'doc'],
        search: { imdb: 'torrents.php?searchstr={imdb}', name: 'torrents.php?searchstr={name}' },
        groupUpload: true,
        description: 'PassThePopcorn'
    },
    {
        name: 'RED',
        type: SiteType.Gazelle,
        keywords: ['redacted.sh', 'redacted.ch'],
        baseUrl: 'https://redacted.sh/',
        preferCurrentHost: true,
        contentDomains: ['music'],
        description: 'Redacted',
        features: {
            imdbSearch: false,
            doubanSearch: false,
        }
    },
    {
        name: 'OPS',
        type: SiteType.Gazelle,
        keywords: ['orpheus.network'],
        baseUrl: 'https://orpheus.network/',
        contentDomains: ['music'],
        description: 'Orpheus',
    },
    {
        name: 'DIC',
        type: SiteType.Gazelle,
        keywords: ['dicmusic.com'],
        baseUrl: 'https://dicmusic.com/',
        contentDomains: ['music'],
        description: 'DICMusic'
    },
    {
        name: 'BTN',
        type: SiteType.BTN,
        keywords: ['broadcasthe.net', 'backup.landof.tv'],
        baseUrl: 'https://broadcasthe.net/',
        mirrorUrl: 'https://backup.landof.tv/',
        preferCurrentHost: true,
        contentDomains: ['tv', 'miniseries'],
        search: {
            imdb: 'torrents.php?action=advanced&imdb={imdb}',
            name: 'torrents.php?searchstr={name}'
        },
        description: 'BroadcasTheNet (BTN)'
    },
    {
        name: 'ANT',
        type: SiteType.Gazelle,
        keywords: ['anthelion.me'],
        baseUrl: 'https://anthelion.me/',
        experimental: true,
        contentDomains: ['movie'],
        search: {
            imdb: 'torrents.php?order_by=time&order_way=desc&searchstr={imdb}&search_type=0',
            name: 'torrents.php?order_by=time&order_way=desc&searchstr={name}&search_type=0'
        },
        description: 'Anthelion (ANT)'
    },
    {
        name: 'TVV',
        type: SiteType.Gazelle,
        keywords: ['tv-vault.me'],
        baseUrl: 'https://tv-vault.me/',
        experimental: true,
        contentDomains: ['tv', 'miniseries'],
        search: {
            imdb: 'torrents.php?searchstr={imdb}',
            name: 'torrents.php?searchstr={name}'
        },
        description: 'TV-Vault (TVV)'
    },
    {
        name: 'NBL',
        type: SiteType.Gazelle,
        keywords: ['nebulance.io'],
        baseUrl: 'https://nebulance.io/',
        experimental: true,
        contentDomains: ['tv', 'miniseries'],
        search: {
            imdb: 'torrents.php?order_by=time&order_way=desc&searchtext={name}&search_type=0',
            name: 'torrents.php?order_by=time&order_way=desc&searchtext={name}&search_type=0'
        },
        description: 'Nebulance (NBL)'
    },
    {
        name: 'HD-Only',
        type: SiteType.Gazelle,
        keywords: ['hd-only.org'],
        baseUrl: 'https://hd-only.org/',
        experimental: true,
        search: {
            imdb: 'torrents.php?searchstr={imdb}',
            name: 'torrents.php?searchstr={name}'
        },
        description: 'HD-Only'
    },
    {
        name: 'HDF',
        type: SiteType.Gazelle,
        keywords: ['hdf.world'],
        baseUrl: 'https://hdf.world/',
        experimental: true,
        search: {
            imdb: 'torrents.php?searchstr={imdb}',
            name: 'torrents.php?searchstr={name}'
        },
        description: 'HD-Forever (HDF)'
    },
    {
        name: 'jpop',
        type: SiteType.Gazelle,
        keywords: ['jpopsuki.eu'],
        baseUrl: 'https://jpopsuki.eu/',
        contentDomains: ['music'],
        capabilities: { source: true, target: false },
        features: {
            imdbSearch: false,
            doubanSearch: false
        },
        description: 'JPopsuki (Source-only)'
    },
    {
        name: 'lztr',
        type: SiteType.Gazelle,
        keywords: ['lztr.me'],
        baseUrl: 'https://lztr.me/',
        contentDomains: ['music'],
        capabilities: { source: true, target: false },
        features: {
            imdbSearch: false,
            doubanSearch: false
        },
        description: 'LzTr (Source-only)'
    }
];
