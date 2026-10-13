
import { TorrentMeta } from './TorrentMeta';

export enum SiteType {
    NexusPHP = 'NexusPHP',
    Gazelle = 'Gazelle',
    Unit3D = 'Unit3D',
    Unit3DClassic = 'Unit3DClassic',
    MTeam = 'MTeam',
    CHDBits = 'CHDBits',
    BHD = 'BHD',
    PTP = 'PTP',
    HDB = 'HDB',
    KG = 'KG',
    HDT = 'HDT',
    Avistaz = 'Avistaz',
    General = 'General'
}

export interface SiteSelectors {
    title?: string | string[];
    subtitle?: string | string[];
    description?: string | string[];
    imdb?: string | string[];
    douban?: string | string[];
    // Upload form selectors
    nameInput?: string;
    descrInput?: string;
    smallDescrInput?: string;
    imdbInput?: string;
    doubanInput?: string;
    torrentInput?: string;
}

export interface SiteConfig {
    name: string;
    type: SiteType;
    keywords: string[]; // Domain fragments matched against the page hostname
    description?: string; // Human readable description
    baseUrl?: string; // Canonical base URL for cross-site links

    // URL matching patterns
    match?: {
        source?: RegExp[];
        target?: RegExp[];
    };

    // Custom selectors override
    selectors?: SiteSelectors;

    // Feature flags
    features?: {
        imdbSearch?: boolean;
        doubanSearch?: boolean;
        autoFill?: boolean;
    };

    // Optional alternate URL alias for trackers with multiple domains.
    mirrorUrl?: string;

    /** Upload page path relative to baseUrl. Defaults per framework (see config/frameworks.ts). */
    uploadPath?: string;

    /** Dupe-search URL templates relative to baseUrl. Defaults per framework. */
    search?: SiteSearchTemplates;

    /** Settings key holding a user-chosen base URL for this site (domains that change often). */
    baseUrlSetting?: 'chdBaseUrl' | 'tlBaseUrl';

    /** Link to the current page's domain when the user is already on one of this site's domains. */
    preferCurrentHost?: boolean;

    /** Gazelle movie sites: look the movie up first and open `upload.php?groupid=` (legacy parity). */
    groupUpload?: boolean;
}

/**
 * Search URL templates. Placeholders: `{imdb}` = tt1234567, `{imdbNo}` = 1234567,
 * `{name}` = URL-encoded search name. `imdb` is used when the torrent has an IMDb id,
 * otherwise `name`; omit `imdb` to always search by name.
 */
export interface SiteSearchTemplates {
    imdb?: string;
    name: string;
}
