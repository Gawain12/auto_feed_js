
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
        name: 'HDF',
        type: SiteType.Unit3D,
        keywords: ['hdf.world'],
        baseUrl: 'https://hdf.world/',
        description: 'HD-Forever',
    },
    {
        name: 'PrivateHD',
        type: SiteType.Unit3D,
        keywords: ['privatehd.to'],
        baseUrl: 'https://privatehd.to/',
        description: 'PrivateHD'
    }
];
