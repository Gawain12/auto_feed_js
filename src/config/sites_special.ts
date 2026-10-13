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
    }
];
