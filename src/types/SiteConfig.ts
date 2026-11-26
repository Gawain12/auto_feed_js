
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
    BTN = 'BTN',
    HDRoute = 'HDRoute',
    FileList = 'FileList',
    TorrentLeech = 'TorrentLeech',
    CG = 'CG',
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

export type NexusFieldValue = string | { index: number };

export interface NexusTitleOverride {
    pattern: string;
    flags?: string;
    whenType?: string;
    whenMedium?: string;
    whenCodec?: string;
    whenAudio?: string;
    whenStandard?: string;
    whenDiy?: boolean;
    inField?: 'title' | 'descr' | 'smallDescr' | 'all';
    value: NexusFieldValue;
}

export interface NexusSelectMapping {
    selector: string;
    map: Record<string, NexusFieldValue>;
    defaultValue?: NexusFieldValue;
    titleOverrides?: NexusTitleOverride[];
}

export interface NexusFillProfile {
    type?: NexusSelectMapping;
    specialcat?: NexusSelectMapping;
    specialcatMode5?: boolean;
    specialcatExtras?: Array<{
        selector: string;
        value: NexusFieldValue;
        whenPattern?: string;
    }>;
    medium?: NexusSelectMapping;
    codec?: NexusSelectMapping;
    codecAudioFallback?: Record<string, NexusFieldValue>;
    audio?: NexusSelectMapping;
    standard?: NexusSelectMapping;
    source?: NexusSelectMapping;
    sourceByMedium?: NexusSelectMapping;
    sourceByType?: NexusSelectMapping;
    processingByMedium?: NexusSelectMapping;
    processingBySource?: NexusSelectMapping;
    processingByHdr?: {
        selector: string;
        db?: NexusFieldValue;
        hdr10?: NexusFieldValue;
        hdr10plus?: NexusFieldValue;
        defaultValue?: NexusFieldValue;
    };
    processingByYear?: {
        selector: string;
        mode: 'buckets' | 'optionText';
        defaultValue?: NexusFieldValue;
    };
    team?: {
        selector: string;
        defaultValue: NexusFieldValue;
        matchOption?: boolean;
        matchMode?: 'standard' | 'okpt' | 'muxuege';
    };
    customTags?: Array<{
        selector: string;
        when: '4k_sdr' | 'hdr10' | 'dv' | 'effects_sub' | 'jp_lang' | 'kr_lang' | 'agsv_ark';
    }>;
}

export type SiteContentDomain =
    | 'movie'
    | 'tv'
    | 'miniseries'
    | 'music'
    | 'anime'
    | 'doc'
    | 'book'
    | 'game'
    | 'misc';

export interface SiteConfig {
    name: string;
    type: SiteType;
    keywords: string[]; // Domain fragments matched against the page hostname
    description?: string; // Human readable description
    baseUrl?: string; // Canonical base URL for cross-site links

    /** Whether this site uses the Chinese NexusPHP layout / metadata workflow. */
    isChinese?: boolean;

    /** Whether this site is newly ported without full live verification (collapsed in Settings UI). */
    experimental?: boolean;

    /** Content domains accepted by this tracker (omitted => general video tracker). */
    contentDomains?: SiteContentDomain[];

    /** Source/target capabilities; omit to default both to true. */
    capabilities?: {
        source?: boolean;
        target?: boolean;
    };

    /** Optional declarative NexusPHP dropdown mappings extracted from legacy. */
    nexusProfile?: NexusFillProfile;

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
