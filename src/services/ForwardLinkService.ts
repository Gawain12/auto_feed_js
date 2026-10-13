import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { defaultSearch, defaultUploadPath } from '../config/frameworks';
import { extractImdbId } from '../common/rules/links';
import { getSearchName } from '../common/rules/search';
import { GMAdapter } from './GMAdapter';

export interface ForwardLinkOptions {
    chdBaseUrl?: string;
    tlBaseUrl?: string;
    lang?: 'zh' | 'en';
}

const normalizeBaseUrl = (base?: string) => {
    if (!base) return '';
    return base.endsWith('/') ? base : `${base}/`;
};

const resolveBaseUrl = (site: SiteConfig, options?: ForwardLinkOptions) => {
    if (site.preferCurrentHost && site.keywords.some((k) => window.location.host.includes(k))) {
        return `${window.location.protocol}//${window.location.host}/`;
    }
    const userBase = site.baseUrlSetting ? options?.[site.baseUrlSetting] : '';
    return normalizeBaseUrl(userBase || site.baseUrl);
};

const joinUrl = (base: string, path: string) => {
    if (!base.endsWith('/')) base += '/';
    if (path.startsWith('/')) path = path.slice(1);
    return `${base}${path}`;
};

const buildUploadUrl = (site: SiteConfig, options?: ForwardLinkOptions): string => {
    const base = resolveBaseUrl(site, options);
    if (!base) return '#';
    return joinUrl(base, site.uploadPath || defaultUploadPath(site.type));
};

const buildSearchUrl = (site: SiteConfig, meta: TorrentMeta, options?: ForwardLinkOptions): string => {
    const base = resolveBaseUrl(site, options);
    if (!base) return '#';
    const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
    const templates = site.search || defaultSearch(site.type);
    const template = imdbId && templates.imdb ? templates.imdb : templates.name;
    const path = template
        .replace(/\{imdbNo\}/g, imdbId.replace(/^tt/i, ''))
        .replace(/\{imdb\}/g, encodeURIComponent(imdbId))
        .replace(/\{name\}/g, () => encodeURIComponent(getSearchName(meta.title || '', meta.type) || meta.title || ''));
    return joinUrl(base, path);
};

const normalizeMovieKey = (value: string) => String(value || '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractYear = (meta: TorrentMeta): string => {
    const text = `${meta.title || ''} ${meta.subtitle || ''} ${meta.smallDescr || ''} ${meta.description || ''}`;
    return text.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || '';
};

const extractGroupIdFromHtml = (html: string, siteName: string, meta?: TorrentMeta): string => {
    if (!html) return '';
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (siteName === 'SC') {
            const imdbId = meta ? (meta.imdbId || extractImdbId(meta.imdbUrl || '') || '') : '';
            const imdbNo = imdbId.replace(/^tt/i, '');
            const titleKey = meta ? normalizeMovieKey(getSearchName(meta.title || '', meta.type) || meta.title || '') : '';
            const year = meta ? extractYear(meta) : '';
            const candidates = Array.from(doc.querySelectorAll(
                'div.torrent_card_container, div.torrent_card, .group, table.torrent_table tr, tr'
            )) as HTMLElement[];

            for (const candidate of candidates) {
                const link = candidate.querySelector('a[href*="torrents.php?id="], a[href*="?id="]') as HTMLAnchorElement | null;
                const id = link?.href?.match(/[?&]id=(\d+)/i)?.[1] || '';
                if (!id) continue;

                const blob = `${candidate.textContent || ''} ${candidate.innerHTML || ''}`;
                const blobKey = normalizeMovieKey(blob);
                const exactImdb = imdbId && (blob.includes(imdbId) || (!!imdbNo && blob.includes(imdbNo)));
                const exactTitle = titleKey && blobKey.includes(titleKey) && (!year || blobKey.includes(year));
                if (exactImdb || exactTitle) return id;
            }
            return '';
        }
        if (siteName === 'PTP') {
            const link = doc.querySelector('a[href*="torrents.php?id="], a.basic-movie-list__movie__cover-link[href*="id="]') as HTMLAnchorElement | null;
            return link?.href?.match(/[?&]id=(\d+)/i)?.[1] || '';
        }
    } catch {}
    return html.match(/torrents\.php\?id=(\d+)/i)?.[1] || html.match(/[?&]id=(\d+)/i)?.[1] || '';
};

const resolveGazelleMovieUploadUrl = async (
    site: SiteConfig,
    meta: TorrentMeta,
    options?: ForwardLinkOptions
): Promise<string> => {
    const base = resolveBaseUrl(site, options);
    const baseUpload = joinUrl(base, 'upload.php');
    const searchUrl = buildSearchUrl(site, meta, options);
    try {
        const res = await GMAdapter.xmlHttpRequest({ method: 'GET', url: searchUrl, timeout: 12000 });
        const finalUrl = String(res?.finalUrl || res?.responseURL || '');
        const finalGroupId = finalUrl.match(/[?&]id=(\d+)/i)?.[1] || '';
        const htmlGroupId = extractGroupIdFromHtml(String(res?.responseText || ''), site.name, meta);
        const groupId = finalGroupId || htmlGroupId;
        return groupId ? `${baseUpload}?groupid=${encodeURIComponent(groupId)}` : baseUpload;
    } catch (e) {
        console.warn(`[Auto-Feed][${site.name}] group upload lookup failed, using plain upload.php`, e);
        return baseUpload;
    }
};

export class ForwardLinkService {
    static getUploadUrl(site: SiteConfig, options?: ForwardLinkOptions): string {
        return buildUploadUrl(site, options);
    }

    static getSearchUrl(site: SiteConfig, meta: TorrentMeta, options?: ForwardLinkOptions): string {
        return buildSearchUrl(site, meta, options);
    }

    static getBaseUrl(site: SiteConfig, options?: ForwardLinkOptions): string {
        return resolveBaseUrl(site, options);
    }

    static async resolveUploadUrl(site: SiteConfig, meta: TorrentMeta, options?: ForwardLinkOptions): Promise<string> {
        if (site.groupUpload) {
            return resolveGazelleMovieUploadUrl(site, meta, options);
        }
        return buildUploadUrl(site, options);
    }
}
