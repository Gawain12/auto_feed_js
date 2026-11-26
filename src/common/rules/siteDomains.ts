import { SiteConfig, SiteContentDomain } from '../../types/SiteConfig';
import { TorrentMeta } from '../../types/TorrentMeta';

/** Default accepted domains for comprehensive video trackers (Chinese NexusPHP, BLU, BHD, HDB, HDT, etc.). */
export const GENERAL_VIDEO_DOMAINS: readonly SiteContentDomain[] = [
    'movie',
    'tv',
    'miniseries',
    'anime',
    'doc',
    'misc'
];

export function getSiteDomains(site?: Pick<SiteConfig, 'contentDomains'> | null): readonly SiteContentDomain[] {
    if (site?.contentDomains && site.contentDomains.length > 0) {
        return site.contentDomains;
    }
    return GENERAL_VIDEO_DOMAINS;
}

function hasVideoSignal(meta: Partial<TorrentMeta>): boolean {
    if (meta.standardSel && /^(?:8K|4K|1080p|1080i|720p|SD)$/i.test(meta.standardSel)) return true;
    if (meta.codecSel && /^(?:H264|X264|H265|X265|H266|VC-1|MPEG-2|MPEG-4|AV1|VP9|XVID)$/i.test(meta.codecSel)) return true;
    const text = `${meta.title || ''} ${meta.subtitle || ''} ${meta.smallDescr || ''}`;
    if (/(?:2160p|1080[pi]|720p|480p|576p|x26[45]|H\.?26[45]|HEVC|AVC|REMUX|WEB-?DL|HDTV|DVD[59]|演唱会|音乐会|concert)/i.test(text)) {
        return true;
    }
    return false;
}

/**
 * Infer which content domain(s) a parsed torrent belongs to so forwarding links can hide
 * unrelated trackers (e.g., music vs video, GPW vs BTN) while preserving genuine overlaps
 * such as PTP <-> BTN miniseries.
 */
export function inferTorrentDomains(
    meta: Partial<TorrentMeta>,
    sourceSite?: Pick<SiteConfig, 'name' | 'contentDomains'> | null
): SiteContentDomain[] {
    const srcDomains = sourceSite?.contentDomains;

    // 1. Single-purpose non-video source trackers always stay in their native domain.
    if (
        srcDomains &&
        srcDomains.length === 1 &&
        (srcDomains[0] === 'music' || srcDomains[0] === 'book' || srcDomains[0] === 'game')
    ) {
        return [srcDomains[0]];
    }

    // 2. Explicit audio/music metadata or audio-only music category on a general site.
    if (meta.musicMedia || meta.tracklist) {
        return ['music'];
    }
    if (meta.type === '音乐' && !hasVideoSignal(meta)) {
        return ['music'];
    }

    // 3. Books / learning & games.
    if (meta.type === '书籍' || meta.type === '学习') {
        return ['book'];
    }
    if (meta.type === '游戏') {
        return ['game'];
    }

    const titleAndSub = [meta.title, meta.subtitle, meta.smallDescr, meta.editionInfo]
        .filter(Boolean)
        .join('\n');
    const headDescr = String(meta.description || '').slice(0, 600);

    const explicitMiniseries =
        /\b(?:mini[\s.-]?series|limited[\s.-]?series)\b|迷你[剧劇]/i.test(titleAndSub) ||
        /\b(?:mini[\s.-]?series|limited[\s.-]?series)\b|迷你[剧劇]/i.test(headDescr);
    const hasMultiSeason =
        /\bS0?[2-9]\b|\bS[1-9]\d\b|\bS0?1\s*[-–]\s*S?0?[2-9]\b|\bSeasons?\s*0?1\s*[-–]\s*0?[2-9]\b|\bSeason\s*[2-9]\b|第[二三四五六七八九十2-9]季/i.test(titleAndSub);
    const hasSingleEpisode =
        /\bS\d{1,2}E\d{1,3}(?!\s*[-–]\s*E?\d)\b|\bEP?0?\d{1,3}(?!\s*[-–]\s*(?:EP?)?\d)\b|第\d+集/i.test(titleAndSub);
    const hasSeason1Pack =
        /\bS0?1\b(?!E\d)|\bSeason\s*0?1\b|第一季|全\d+集|\bComplete\b/i.test(titleAndSub);
    const hasTvMarker =
        /\bS\d{1,2}(?:E\d{1,3})?\b|\bSeason\s*\d+\b|第[一二三四五六七八九十\d]+季|全\d+集/i.test(titleAndSub);

    const isPureTvSource = !!srcDomains && srcDomains.includes('tv') && !srcDomains.includes('movie');

    // 4. TV series & miniseries.
    if (meta.type === '剧集' || isPureTvSource) {
        if (explicitMiniseries && !hasMultiSeason && !hasSingleEpisode) {
            return ['miniseries', 'tv'];
        }
        if (hasMultiSeason || hasSingleEpisode) {
            return ['tv'];
        }
        if (hasSeason1Pack || (isPureTvSource && srcDomains?.includes('miniseries'))) {
            return ['tv', 'miniseries'];
        }
        return ['tv'];
    }

    // Miniseries hosted on a movie+miniseries tracker (e.g. PTP) or tagged explicitly.
    if (explicitMiniseries && !hasMultiSeason) {
        return ['miniseries', 'tv'];
    }

    // 5. Movies.
    if (meta.type === '电影') {
        if (sourceSite?.name === 'PTP' && hasTvMarker && !hasMultiSeason && !hasSingleEpisode) {
            return ['miniseries', 'tv'];
        }
        return ['movie'];
    }

    // 6. Documentaries.
    if (meta.type === '纪录') {
        if (hasMultiSeason || hasSingleEpisode) return ['doc', 'tv'];
        if (hasSeason1Pack) return ['doc', 'tv', 'miniseries'];
        return ['doc', 'movie'];
    }

    // 7. Anime.
    if (meta.type === '动漫') {
        if (hasMultiSeason || hasSingleEpisode) return ['anime', 'tv'];
        if (hasSeason1Pack) return ['anime', 'tv', 'miniseries'];
        return ['anime', 'movie'];
    }

    // 8. Variety shows -> TV / comprehensive trackers.
    if (meta.type === '综艺') {
        return ['tv'];
    }

    // 9. Music videos / concerts / sports -> comprehensive video trackers.
    if (meta.type === 'MV' || meta.type === '体育') {
        return ['misc'];
    }

    // 10. Fallback when type could not be determined: use source site's own domains.
    return [...getSiteDomains(sourceSite)];
}

export function isTargetSiteCompatible(
    targetSite: Pick<SiteConfig, 'contentDomains'>,
    torrentDomains: readonly SiteContentDomain[]
): boolean {
    const targetDomains = getSiteDomains(targetSite);
    return torrentDomains.some((d) => targetDomains.includes(d));
}

export function filterForwardTargets<T extends Pick<SiteConfig, 'name' | 'contentDomains'>>(
    targets: readonly T[],
    meta: Partial<TorrentMeta>,
    sourceSite?: Pick<SiteConfig, 'name' | 'contentDomains'> | null,
    enabled = true
): { visible: T[]; hidden: T[]; domains: SiteContentDomain[] } {
    const domains = inferTorrentDomains(meta, sourceSite);
    if (!enabled) {
        return { visible: [...targets], hidden: [], domains };
    }
    const visible: T[] = [];
    const hidden: T[] = [];
    for (const site of targets) {
        if (isTargetSiteCompatible(site, domains)) {
            visible.push(site);
        } else {
            hidden.push(site);
        }
    }
    return { visible, hidden, domains };
}
