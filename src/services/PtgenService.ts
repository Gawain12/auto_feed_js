import { DoubanService, DoubanInfo } from './DoubanService';
import { HtmlFetchService } from './HtmlFetchService';
import { TorrentMeta } from '../types/TorrentMeta';
import { getSmallDescrFromDescr, getSourceSelFromDescr } from '../common/rules/helpers';
import { extractDoubanId, extractImdbId } from '../common/rules/links';

export interface PtgenOptions {
    imdbToDoubanMethod: number; // 0: Douban API, 1: Douban scrape
    ptgenApi: number; // 0: api.iyuu.cn, 1: ptgen, 3: douban page scrape
    doubanCookie?: string;
}

export interface PtgenApplyFlags {
    mergeDescription?: boolean; // prepend ptgen block into description (default true)
    updateSubtitle?: boolean;   // fill subtitle/smallDescr (default true)
    updateRegion?: boolean;     // fill sourceSel (default true)
    updateIds?: boolean;        // fill imdb/douban ids+urls (default true)
    updateSynopsis?: boolean;   // fill synopsis (default true)
    overwrite?: boolean;        // overwrite existing fields (default false)
}

const IYUU_API = 'https://api.iyuu.cn/App.Movie.Ptgen';
const TJU_API = 'https://ptgen.tju.pt/infogen';

export const buildDoubanFormat = (info: DoubanInfo, imdbId?: string): string => {
    const lines: string[] = [];
    if (info.image) lines.push(`[img]${info.image}[/img]`, '');
    const title = info.title || '';
    const originalTitle = info.originalTitle || title;
    const effectiveImdbId = imdbId || info.imdbId || '';
    const splitItems = (raw?: string) =>
        String(raw || '')
            .split(/\s*\/\s*/)
            .map((s) => s.trim())
            .filter(Boolean);

    const translatedNames = Array.from(new Set([title, ...splitItems(info.aka)].filter(Boolean)));
    if (translatedNames.length) lines.push(`◎译　　名　${translatedNames.join(' / ')}`);
    if (originalTitle) lines.push(`◎片　　名　${originalTitle}`);
    if (info.year) lines.push(`◎年　　代　${info.year}`);
    if (info.region) lines.push(`◎产　　地　${info.region}`);
    if (info.genre) lines.push(`◎类　　别　${info.genre}`);
    if (info.language) lines.push(`◎语　　言　${info.language}`);
    if (info.releaseDate) lines.push(`◎上映日期　${info.releaseDate}`);
    if (effectiveImdbId) lines.push(`◎IMDb链接  https://www.imdb.com/title/${effectiveImdbId}/`);
    if (info.average) {
        const votes = info.votes ? ` from ${info.votes} users` : '';
        lines.push(`◎豆瓣评分　${info.average}/10${votes}`);
    }
    if (info.id) lines.push(`◎豆瓣链接　https://movie.douban.com/subject/${info.id}/`);
    if (info.episodes) lines.push(`◎集　　数　${info.episodes}`);
    if (info.runtime) lines.push(`◎片　　长　${info.runtime}`);
    const formatCredits = (label: string, raw?: string, maxCount = 15) => {
        const items = splitItems(raw).slice(0, maxCount);
        if (!items.length) return;
        lines.push(`${label}${items[0]}`);
        for (let i = 1; i < items.length; i++) {
            lines.push(`　　　　　　${items[i]}`);
        }
    };
    formatCredits('◎导　　演　', info.director, 6);
    formatCredits('◎编　　剧　', info.writer, 8);
    formatCredits('◎主　　演　', info.cast, 15);
    lines.push('');
    lines.push('◎简　　介');
    if (info.summary) {
        lines.push(info.summary.replace(/^|\n/g, '\n　　').replace(/^\n+/, '').trimEnd());
    } else {
        lines.push('　　暂无相关剧情介绍');
    }
    if (info.awards && info.awards.length) {
        lines.push('');
        lines.push('◎获奖情况');
        lines.push('');
        for (const award of info.awards) {
            lines.push(`　　${award}`);
        }
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

export interface PtgenFetchResult {
    format: string;
    doubanId?: string;
    synopsis?: string;
    poster?: string;
}

export const hasPtgenBlock = (descr: string): boolean => {
    const s = String(descr || '');
    const hits = (s.match(/◎\s*(?:译|譯|片|年|产|產|类|類|语|語|简|簡|导|導|主)\s*(?:名|代|地|别|別|言|介|演)/g) || []).length;
    return hits >= 3;
};

export const stripLeadingPtgenBlock = (descr: string): string => {
    const raw = String(descr || '').trim();
    if (!raw || !hasPtgenBlock(raw)) return raw;
    const lines = raw.split(/\r?\n/);
    const firstMarkerIdx = lines.findIndex((l) => /^◎/.test(l.trim()));
    if (firstMarkerIdx < 0) return raw;

    // Also include a lone poster `[img]...[/img]` immediately preceding the `◎` block.
    let startIdx = firstMarkerIdx;
    while (startIdx > 0 && !lines[startIdx - 1].trim()) startIdx -= 1;
    if (startIdx > 0 && /^\[img\][^\[\]]+\[\/img\]$/i.test(lines[startIdx - 1].trim())) {
        startIdx -= 1;
    }

    let passedSynopsis = false;
    let endIdx = firstMarkerIdx + 1;
    for (let i = firstMarkerIdx + 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (/^\[(?:quote|code|mediainfo|bdinfo|hide|spoiler|b)\b/i.test(trimmed)) {
            break;
        }
        if (/^\[img\][^\[\]]+\[\/img\]$/i.test(trimmed) && passedSynopsis) {
            break;
        }
        if (/^◎\s*(?:简|簡)\s*介/.test(trimmed) || /^◎\s*(?:获|獲)\s*(?:奖|獎)/.test(trimmed)) {
            passedSynopsis = true;
        }
        endIdx = i + 1;
    }

    const combined = [...lines.slice(0, startIdx), ...lines.slice(endIdx)]
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    // Recursively strip stacked duplicate PTGen blocks if present.
    return hasPtgenBlock(combined) && combined !== raw ? stripLeadingPtgenBlock(combined) : combined;
};

export const extractPosterFromPtgen = (format: string): string =>
    String(format || '').match(/\[img\](https?:\/\/[^\s\]]+)\[\/img\]/i)?.[1]?.trim() || '';

export class PtgenService {
    static extractSubtitle(format: string, title = ''): string {
        const legacySmall = getSmallDescrFromDescr(format, title);
        return legacySmall || this.extractSubtitleFromFormat(format);
    }

    private static extractSubtitleFromFormat(format: string): string {
        const lines = format.split('\n').map((line) => line.trim()).filter(Boolean);
        const getLineValue = (pattern: RegExp) => {
            const line = lines.find((l) => pattern.test(l));
            if (!line) return '';
            const parts = line.split(/[:：]/);
            const value = parts.length > 1 ? parts.slice(1).join(':').trim() : line.replace(pattern, '').trim();
            return value;
        };

        const pickChinese = (value: string) => {
            if (!value) return '';
            const first = value.split('/')[0].trim();
            return /[\u4e00-\u9fa5]/.test(first) ? first : '';
        };

        const translated = pickChinese(getLineValue(/译.*名/));
        if (translated) return translated;

        const mainTitle = pickChinese(getLineValue(/片.*名/));
        if (mainTitle) return mainTitle;

        return '';
    }

    static async resolveDoubanId(meta: TorrentMeta, method: number, doubanCookie?: string): Promise<string | null> {
        if (meta.doubanId) return meta.doubanId;
        const doubanIdFromUrl = extractDoubanId(meta.doubanUrl || '');
        if (doubanIdFromUrl) return doubanIdFromUrl;

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        if (!imdbId) return null;

        const cached = DoubanService.getCachedByImdb(imdbId);
        if (cached?.id) return cached.id;

        if (method === 0) {
            const url = `https://movie.douban.com/j/subject_suggest?q=${imdbId}`;
            try {
                const text = await HtmlFetchService.getText(url, {
                    headers: doubanCookie ? { cookie: doubanCookie } : undefined,
                    withCredentials: true
                });
                const json = JSON.parse(text);
                if (Array.isArray(json) && json.length) {
                    const id = json[0]?.id?.toString();
                    if (id && id !== '35580200') return id;
                }
            } catch {}
            return null;
        }

        try {
            const info = await DoubanService.getByImdb(imdbId, { cookie: doubanCookie, withCredentials: true });
            return info?.id || null;
        } catch {
            return null;
        }
    }

    private static async fetchPtgenOnce(meta: TorrentMeta, options: PtgenOptions): Promise<PtgenFetchResult | null> {
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
        const doubanId = await this.resolveDoubanId(meta, options.imdbToDoubanMethod, options.doubanCookie);

        if (options.ptgenApi === 3) {
            const info =
                (doubanId ? await DoubanService.getById(doubanId, { cookie: options.doubanCookie, withCredentials: true }) : null) ||
                (imdbId ? await DoubanService.getByImdb(imdbId, { cookie: options.doubanCookie, withCredentials: true }) : null);
            if (!info) return null;
            return {
                format: buildDoubanFormat(info, imdbId || undefined),
                doubanId: info.id,
                synopsis: info.summary || '',
                poster: info.image || ''
            };
        }

        const base = options.ptgenApi === 0 ? IYUU_API : TJU_API;
        let query = '';
        if (doubanId) {
            query = `?url=${encodeURIComponent(`https://movie.douban.com/subject/${doubanId}/`)}`;
        } else if (meta.doubanUrl) {
            query = `?url=${encodeURIComponent(meta.doubanUrl)}`;
        } else if (meta.imdbUrl) {
            if (options.ptgenApi === 1) {
                query = `?site=douban&sid=${imdbId}`;
            } else {
                query = `?url=${encodeURIComponent(meta.imdbUrl)}`;
            }
        } else if (imdbId) {
            if (options.ptgenApi === 1) {
                query = `?site=douban&sid=${imdbId}`;
            } else {
                query = `?url=${encodeURIComponent(`https://www.imdb.com/title/${imdbId}/`)}`;
            }
        } else {
            return null;
        }

        try {
            const text = await HtmlFetchService.getText(`${base}${query}`, { withCredentials: true });
            let format = '';
            try {
                const json = JSON.parse(text);
                format = json?.data?.format || json?.format || json?.data || '';
            } catch {
                // Some providers may return plain text on errors/limits; best-effort fallback.
                format = text || '';
            }
            if (!format || typeof format !== 'string') return null;
            // Heuristic: if it doesn't look like a ptgen/douban block, treat it as a failed response.
            if (!format.match(/◎简\s*介|◎译\s*名|douban\.com\/subject\/\d+|imdb\.com\/title\/tt\d+/i)) return null;
            format = format.replace('hongleyou.cn', 'doubanio.com').replace(/\[\/img\]\[\/center\]/g, '[/img]');
            return {
                format,
                doubanId: extractDoubanId(format) || doubanId || undefined,
                poster: extractPosterFromPtgen(format) || undefined
            };
        } catch {
            return null;
        }
    }

    static async fetchPtgen(meta: TorrentMeta, options: PtgenOptions): Promise<PtgenFetchResult | null> {
        // Provider fallback:
        // - 3 (douban scrape) can fail due to captcha/rate-limits.
        // - 0/1 can fail due to outages.
        const order = options.ptgenApi === 3 ? [3, 1, 0] : options.ptgenApi === 1 ? [1, 0] : options.ptgenApi === 0 ? [0, 1] : [options.ptgenApi];
        const uniq = Array.from(new Set(order));
        for (const api of uniq) {
            try {
                const r = await this.fetchPtgenOnce(meta, { ...options, ptgenApi: api });
                if (r?.format) return r;
            } catch {
                // continue
            }
        }
        return null;
    }

    static applyPtgenResult(meta: TorrentMeta, result: PtgenFetchResult, flags?: PtgenApplyFlags): TorrentMeta {
        const updated: TorrentMeta = { ...meta };
        const overwrite = !!flags?.overwrite;
        const mergeDescription = flags?.mergeDescription ?? true;
        const updateSubtitle = flags?.updateSubtitle ?? true;
        const updateRegion = flags?.updateRegion ?? true;
        const updateIds = flags?.updateIds ?? true;
        const updateSynopsis = flags?.updateSynopsis ?? true;

        if (mergeDescription) {
            const currentDescr = String(updated.description || '').trim();
            if (!hasPtgenBlock(currentDescr)) {
                updated.description = `${result.format}\n\n${currentDescr}`.trim();
            } else if (overwrite) {
                const rest = stripLeadingPtgenBlock(currentDescr);
                updated.description = `${result.format}\n\n${rest}`.trim();
            }
        }

        if (updateSubtitle) {
            const subtitle = this.extractSubtitle(result.format, updated.title || meta.title || '');
            if (subtitle) {
                if (overwrite || !updated.subtitle) updated.subtitle = subtitle;
                if (overwrite || !updated.smallDescr) updated.smallDescr = subtitle;
            }
        }

        if (updateRegion) {
            try {
                const region = getSourceSelFromDescr(result.format);
                if (region && (overwrite || !updated.sourceSel)) updated.sourceSel = region;
            } catch {}
        }

        if (updateIds) {
            const imdbMatch = extractImdbId(result.format);
            if (imdbMatch) {
                if (overwrite || !updated.imdbId) updated.imdbId = imdbMatch;
                if (overwrite || !updated.imdbUrl) updated.imdbUrl = `https://www.imdb.com/title/${imdbMatch}/`;
            }
            const doubanMatch = extractDoubanId(result.format) || result.doubanId || '';
            if (doubanMatch) {
                if (overwrite || !updated.doubanId) updated.doubanId = doubanMatch;
                if (overwrite || !updated.doubanUrl) updated.doubanUrl = `https://movie.douban.com/subject/${doubanMatch}/`;
            }
        }

        if (updateSynopsis) {
            if (result.synopsis && (overwrite || !updated.synopsis)) {
                updated.synopsis = result.synopsis;
            }
        }

        return updated;
    }

    static async applyPtgen(meta: TorrentMeta, options: PtgenOptions, flags?: PtgenApplyFlags): Promise<TorrentMeta> {
        const result = await this.fetchPtgen(meta, options);
        if (!result || !result.format) return meta;
        return this.applyPtgenResult(meta, result, flags);
    }
}
