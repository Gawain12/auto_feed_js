import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { extractImdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel, getType } from '../common/rules/text';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { setAllFormValues, setFirstFormValue } from '../common/dom/form';
import { hasIdQuery, isPage } from '../common/rules/pages';

function absUrl(href: string, base: string): string {
    if (!href) return '';
    try {
        return new URL(href, base).href;
    } catch {
        return href;
    }
}

function enrichVideoMeta(base: TorrentMeta, text: string): TorrentMeta {
    const combined = `${base.title} ${text}`;
    return {
        ...base,
        type: base.type || getType(combined) || '电影',
        mediumSel: base.mediumSel || getMediumSel(combined, base.title),
        standardSel: base.standardSel || getStandardSel(combined),
        codecSel: base.codecSel || getCodecSel(combined),
        audioCodecSel: base.audioCodecSel || getAudioCodecSel(combined)
    };
}

/** Decode Bibliotik imagecache proxy URLs (`imagecache.bibliotik.me/?url=ssl%3A...`) to direct https URLs. */
export function decodeBibliotikCover(rawHref: string): string {
    const trimmed = (rawHref || '').trim();
    if (!trimmed) return '';
    try {
        const u = new URL(trimmed, 'https://bibliotik.me/');
        if (/imagecache\.bibliotik\.me/i.test(u.hostname)) {
            const inner = u.searchParams.get('url') || '';
            if (inner) {
                const decoded = decodeURIComponent(inner).trim();
                if (/^ssl:/i.test(decoded)) return `https://${decoded.slice(4)}`;
                if (/^https?:\/\//i.test(decoded)) return decoded;
                return `https://${decoded.replace(/^\/+/, '')}`;
            }
        }
    } catch {}
    return trimmed;
}

/** Bibliotik (bib) — live-verified e-book / audiobook source-only tracker. */
export class BibEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return /^\/torrents\/\d+(?:\/)?$/i.test(url.pathname || '');
    }

    async parse(): Promise<TorrentMeta> {
        const title = ($('#title').text() || document.querySelector('h1')?.textContent || document.title).trim();
        const contentInfo = $('#details_content_info').text().trim();
        const creator = $('#creatorlist').text().trim();
        const smallDescr = [contentInfo, creator].filter(Boolean).join(' | ');
        const published = $('#published').text().trim();
        const tags = $('#details_tags').text().trim();

        const rawCover =
            $('#sidebar a').has('img').first().attr('href') ||
            $('#sidebar img').first().attr('src') ||
            '';
        const cover = decodeBibliotikCover(rawCover);

        const parts: string[] = [];
        if (cover) parts.push(`[img]${cover}[/img]`);
        if (published) parts.push(published);
        if (tags) parts.push(tags);

        const descLines: string[] = [];
        $('#description p').each((_, el) => {
            const t = ($(el).text() || '').replace(/\s+/g, ' ').trim();
            if (t) descLines.push(t);
        });
        $('#description li').each((_, el) => {
            const t = ($(el).text() || '').replace(/\s+/g, ' ').trim();
            if (t) descLines.push(`[*]${t}`);
        });
        if (descLines.length) {
            parts.push(`[size=3][b]Description[/b][/size]\n\n${descLines.join('\n\n')}`);
        } else {
            const rawDesc = document.getElementById('description');
            if (rawDesc) parts.push(htmlToBBCode(rawDesc).trim());
        }

        const dlHref = $('a[title="Download"], a[href*="/download"]').first().attr('href') || '';
        return {
            title,
            smallDescr: smallDescr || undefined,
            subtitle: smallDescr || undefined,
            description: parts.join('\n\n').trim(),
            type: '书籍',
            sourceSite: this.siteName,
            sourceUrl: this.currentUrl,
            images: cover ? [cover] : [],
            torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined
        };
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}

/** IPTorrents (IPT) — source-only tracker. */
export class IPTEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return (isPage(url, 'torrent.php') && hasIdQuery(url)) || /^\/t\/\d+/i.test(url.pathname || '');
    }

    async parse(): Promise<TorrentMeta> {
        const title = ($('h1').first().text() || document.title).trim();
        const descrEl = ($('.des').has('blockquote')[0] || $('.des')[0]) as HTMLElement | undefined;
        const description = descrEl ? htmlToBBCode(descrEl).trim() : '';
        const imdbUrl =
            matchLink('imdb', descrEl?.innerHTML || '') ||
            matchLink('imdb', $('#media').html() || '') ||
            matchLink('imdb', document.body.innerHTML) ||
            '';
        const tagsText = $('div.tags').text().trim();
        const dlHref = $('a[href*="download.php"], a[href*="/download.php"]').first().attr('href') || '';
        const info = getMediainfoPictureFromDescr(description);
        return enrichVideoMeta(
            {
                title,
                description,
                fullMediaInfo: info.mediainfo || undefined,
                type: getType(`${tagsText} ${title}`) || '电影',
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: []
            },
            `${tagsText} ${description}`
        );
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}

/** BIT-HDTV — source-only tracker. */
export class BitHDTVEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        const title = ($('td.detail:contains("Torrent"):first').next().text() || $('h1').first().text() || document.title).trim();
        const imdbUrl = matchLink('imdb', document.body.innerHTML) || '';
        const parts: string[] = [];
        const poster = $('td.detail:contains("Poster"):first').next().find('img').attr('src') || '';
        if (poster) parts.push(`[img]${absUrl(poster, this.currentUrl)}[/img]`);
        const mi = ($('#mediainfo').text() || '').trim();
        if (mi) parts.push(`[quote]\n${mi}\n[/quote]`);
        const shots: string[] = [];
        $('td.detail:contains("Screenshots"):first').next().find('a').each((_, el) => {
            const rawHref = ($(el).attr('href') || '').split('url=').pop() || '';
            const href = decodeURIComponent(rawHref);
            const img = $(el).find('img').attr('src') || '';
            if (href && img) shots.push(`[url=${href}][img]${img}[/img][/url]`);
        });
        if (shots.length) parts.push(shots.join(' '));
        const description = parts.join('\n\n').trim();
        const dlHref = $('a[href^="download.php"], a[href*="download.php"]').first().attr('href') || '';
        return enrichVideoMeta(
            {
                title,
                description,
                fullMediaInfo: mi || undefined,
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: poster ? [absUrl(poster, this.currentUrl)] : []
            },
            description
        );
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}

/** BlueBird — source-only tracker. */
export class BlueBirdEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        const dlText = $('#highlighted a[href*="download"]').first().text().trim();
        const title = (dlText ? dlText.split('/').pop()?.trim() : '') || $('h1').first().text().trim() || document.title;
        const imdbUrl = matchLink('imdb', $('#highlighted').html() || document.body.innerHTML) || '';
        const descrTd = $('td:contains(Description)').next();
        let mediainfo = '';
        descrTd.find('div.spoiler-wrap').each((_, el) => {
            if (/mediainfo|BDInfo|minfo/i.test($(el).find('.spoiler-head').text() || '')) {
                mediainfo = ($(el).find('.spoiler-body').text() || '').trim();
            }
        });
        const shots: string[] = [];
        descrTd.find('a').has('img').each((_, el) => {
            const src = $(el).find('img').attr('src') || '';
            const href = $(el).attr('href') || src;
            if (/https?:\/\/.*\.(jpg|jpeg|png|webp)/i.test(src)) {
                shots.push(`[url=${href}][img]${src}[/img][/url]`);
            }
        });
        const description = [mediainfo ? `[quote]\n${mediainfo}\n[/quote]` : '', shots.join(' ')].filter(Boolean).join('\n\n');
        const typeText = $('td:contains(Type)').last().next().text().trim();
        const dlHref = $('#highlighted a[href*="download"], a[href*="download.php"]').first().attr('href') || '';
        return enrichVideoMeta(
            {
                title,
                description,
                fullMediaInfo: mediainfo || undefined,
                type: getType(`${typeText} ${title}`) || '电影',
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: []
            },
            `${typeText} ${description}`
        );
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}

/** BWTorrents — source-only tracker. */
export class BwTorrentsEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        const title = ($('#title_tt').text() || $('h1').first().text() || document.title).trim();
        const imdbUrl = matchLink('imdb', $('table.mainouter').html() || document.body.innerHTML) || '';
        const descrEl = document.getElementById('aeonsystems2017details2');
        const description = (descrEl ? htmlToBBCode(descrEl) : '').replace(/\n\n+/g, '\n').trim();
        const dlHref = $('a[href^="download.php"], a[href*="download.php"]').first().attr('href') || '';
        const info = getMediainfoPictureFromDescr(description);
        return enrichVideoMeta(
            {
                title,
                description,
                fullMediaInfo: info.mediainfo || undefined,
                type: /S\d+|E\d+/i.test(title) ? '剧集' : '电影',
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: []
            },
            description
        );
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}

/** DigitalCore — source-only tracker. */
export class DigitalCoreEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return /^\/torrent\/\d+/i.test(url.pathname || '');
    }

    async parse(): Promise<TorrentMeta> {
        const title = ($('torrent a').first().text() || $('h1, h2').first().text() || document.title).trim();
        const imdbContainer = $('.imdbinfotext').closest('div').parent().parent();
        const imdbUrl = matchLink('imdb', imdbContainer.html() || document.body.innerHTML) || '';
        const infoTd = $('td:contains(Information)').next()[0] as HTMLElement | undefined;
        const description = infoTd ? htmlToBBCode(infoTd).trim() : '';
        const dlHref = $('a[href*="download"]').first().attr('href') || '';
        const info = getMediainfoPictureFromDescr(description);
        return enrichVideoMeta(
            {
                title,
                description,
                fullMediaInfo: info.mediainfo || undefined,
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: []
            },
            description
        );
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}

const HDSPACE_ANNOUNCE = 'http://hd-space.pw/announce.php';

/** HD-Space — bidirectional tracker (`index.php?page=torrent-details` & `index.php?page=upload`). */
export class HDSpaceEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'index.php') && /page=torrent-details/i.test(url.search || '');
    }

    async parse(): Promise<TorrentMeta> {
        const table = $('#mcol table').filter((_, el) => /Info Hash/i.test(el.textContent || '')).first();
        const title = (table.find('td:contains("Name"):first').next().text() || $('h1').first().text() || document.title).trim();
        const imdbUrl = matchLink('imdb', table.html() || document.body.innerHTML) || '';
        let descrEl: HTMLElement | null = null;
        table.find('td').each((_, el) => {
            if ($(el).text().trim() === 'Description') {
                descrEl = ($(el).next()[0] as HTMLElement) || null;
            }
        });
        let description = descrEl ? htmlToBBCode(descrEl) : '';
        description = description.replace(/#[\s\S]*?Nfo hack/i, '').replace(/# End[\s\S]*?#+/i, '').trim();
        const imgs = description.match(/(?:\[url=[^\]]+\])?\[img\][\s\S]*?\[\/img\](?:\[\/url\])?/gi) || [];
        let body = description;
        imgs.forEach((im) => { body = body.replace(im, ''); });
        description = [body.trim() ? `[quote]\n${body.trim()}\n[/quote]` : '', imgs.join('\n')].filter(Boolean).join('\n\n').trim();
        const dlHref = $('a[href*="download.php"]').first().attr('href') || '';
        const info = getMediainfoPictureFromDescr(description);
        return enrichVideoMeta(
            {
                title,
                description,
                fullMediaInfo: info.mediainfo || undefined,
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: []
            },
            description
        );
    }

    async fill(meta: TorrentMeta): Promise<void> {
        setFirstFormValue('#filename, input[name="filename"]', meta.targetTitle || meta.title || '');
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        if (imdbId) setAllFormValues('input[name="imdb"]', imdbId.replace(/^tt/i, ''));

        const rawDescr = `${meta.fullMediaInfo || ''}\n${meta.description || ''}`.trim();
        const info = getMediainfoPictureFromDescr(rawDescr, { mediumSel: meta.mediumSel });
        const mi = (meta.fullMediaInfo || info.mediainfo || '').trim();
        const formatted = [mi ? `[quote]\n${mi}\n[/quote]` : '', info.picInfo || ''].filter(Boolean).join('\n\n');
        setFirstFormValue('textarea[name="info"]', formatted || meta.description || '', { force: true });

        const medium = meta.mediumSel || '';
        const std = meta.standardSel || '';
        const type = meta.type || '电影';
        let cat = '19';
        if (medium === 'UHD' || medium === 'Blu-ray') cat = '15';
        else if (medium === 'Remux') cat = '40';
        else if (medium === 'DVD') cat = '16';
        else if (type === '纪录') cat = std === '4K' ? '47' : std === '720p' ? '24' : '25';
        else if (type === '动漫') cat = std === '720p' ? '27' : '28';
        else if (type === '剧集' || /S\d{2,3}/i.test(meta.title || '')) cat = std === '4K' ? '45' : std === '720p' ? '21' : '22';
        else cat = std === '4K' ? '41' : std === '720p' ? '18' : '19';
        setAllFormValues('select[name="category"]', cat);

        try {
            const { TorrentService } = await import('../services/TorrentService');
            const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, HDSPACE_ANNOUNCE);
            if (result) TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
        } catch (e) {
            console.error('[Auto-Feed][HDSpace] File Injection Failed:', e);
        }
    }
}

/** iTS (shadowthein.net) — source-only tracker (legacy delegates target uploads to external iTS Upload Helper). */
export class ITSEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        const title = ($('h1').first().text() || document.title).trim();
        const imdbHtml = document.querySelector('.IMDBtable')?.innerHTML || document.body.innerHTML;
        const imdbUrl = matchLink('imdb', imdbHtml) || '';
        const dlHref = $('a[href*="download.php"]').first().attr('href') || '';
        return enrichVideoMeta(
            {
                title,
                description: '',
                sourceSite: this.siteName,
                sourceUrl: this.currentUrl,
                imdbUrl: imdbUrl || undefined,
                imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
                torrentUrl: dlHref ? absUrl(dlHref, this.currentUrl) : undefined,
                images: []
            },
            title
        );
    }

    async fill(_meta: TorrentMeta): Promise<void> {}
}
