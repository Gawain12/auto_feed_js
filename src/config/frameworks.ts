import { SiteSearchTemplates, SiteType } from '../types/SiteConfig';

// Framework-level defaults for sites that do not set `uploadPath` / `search` themselves.
// Site-specific values belong in the site's own entry in `config/sites_*.ts`.

const NEXUS_SEARCH: SiteSearchTemplates = {
    // Legacy parity: IMDb lookups use search_area=4, title lookups search_area=0.
    imdb: 'torrents.php?incldead=0&spstate=0&inclbookmarked=0&search={imdb}&search_area=4&search_mode=0',
    name: 'torrents.php?incldead=0&spstate=0&inclbookmarked=0&search={name}&search_area=0&search_mode=0'
};

const UNIT3D_SEARCH: SiteSearchTemplates = {
    imdb: 'torrents?imdbId={imdb}#page/1',
    name: 'torrents?search={name}'
};

const GAZELLE_SEARCH: SiteSearchTemplates = {
    imdb: 'torrents.php?searchstr={imdb}',
    name: 'torrents.php?searchstr={name}'
};

const FALLBACK_SEARCH: SiteSearchTemplates = {
    imdb: 'torrents.php?search={imdb}',
    name: 'torrents.php?search={name}'
};

export function defaultUploadPath(type: SiteType): string {
    if (type === SiteType.Unit3D || type === SiteType.Unit3DClassic) return 'torrents/create';
    return 'upload.php';
}

export function defaultSearch(type: SiteType): SiteSearchTemplates {
    switch (type) {
        case SiteType.Unit3D:
        case SiteType.Unit3DClassic:
            return UNIT3D_SEARCH;
        case SiteType.Gazelle:
            return GAZELLE_SEARCH;
        case SiteType.NexusPHP:
        case SiteType.CHDBits:
            return NEXUS_SEARCH;
        default:
            return FALLBACK_SEARCH;
    }
}
