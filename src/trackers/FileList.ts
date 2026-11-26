import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { GMAdapter } from '../services/GMAdapter';
import { extractImdbId, extractTmdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel, getType } from '../common/rules/text';
import { hasIdQuery, isPage } from '../common/rules/pages';

function decodeCloudflareEmails(root: ParentNode) {
    const links = Array.from(root.querySelectorAll('a.__cf_email__, a[data-cfemail]'));
    for (const el of links) {
        const hex = el.getAttribute('data-cfemail') || '';
        if (hex.length < 4) continue;
        const key = parseInt(hex.slice(0, 2), 16);
        let decoded = '';
        for (let i = 2; i < hex.length; i += 2) {
            decoded += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
        }
        el.replaceWith(document.createTextNode(decoded));
    }
}

function mapFileListType(text: string): string {
    if (/Filme/i.test(text)) return '电影';
    if (/Seriale/i.test(text)) return '剧集';
    if (/Anime|Desene/i.test(text)) return '动漫';
    return getType(text) || '电影';
}

export class FileListEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    private async fetchMediaInfo(torrentId: string): Promise<string> {
        if (!torrentId) return '';
        try {
            const url = new URL(`mediainfo.php?id=${encodeURIComponent(torrentId)}`, this.currentUrl).href;
            const res = await GMAdapter.xmlHttpRequest({
                method: 'GET',
                url,
                timeout: 8000
            });
            const html = String(res?.responseText || '');
            if (!html) return '';
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const box = doc.querySelector('#maincolumn div.cblock-innercontent') || doc.querySelector('div.cblock-innercontent');
            if (!box) return '';
            const clone = box.cloneNode(true) as HTMLElement;
            decodeCloudflareEmails(clone);
            const text = htmlToBBCode(clone).replace(/\[\/?font[^\]]*\]/gi, '').trim();
            return text;
        } catch {
            return '';
        }
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing FileList page...');
        const title = ($('h4').first().text() || document.title || '').trim();
        const inner = document.querySelector('.cblock-innercontent') as HTMLElement | null;
        const innerHtml = inner?.innerHTML || document.body.innerHTML || '';

        const imdbUrl = matchLink('imdb', innerHtml) || '';
        const imdbId = extractImdbId(imdbUrl);
        const tmdbUrl = matchLink('tmdb', innerHtml) || '';
        const tmdbId = extractTmdbId(tmdbUrl);

        let categoryText = '';
        const descrDiv = document.getElementById('descr');
        if (tmdbUrl && descrDiv) {
            const bolds = Array.from(document.querySelectorAll('b'));
            const catLabel = bolds.find((b) => (b.textContent || '').trim() === 'Category');
            if (catLabel?.parentElement) {
                categoryText = catLabel.parentElement.textContent || '';
            }
        } else {
            const tds = Array.from(document.querySelectorAll('td'));
            for (let i = 0; i < tds.length - 1; i++) {
                if ((tds[i].textContent || '').trim() === 'Type') {
                    categoryText = tds[i + 1].textContent || '';
                    break;
                }
            }
        }
        const type = mapFileListType(`${categoryText} ${title}`);

        const imgScope = descrDiv || document.querySelector('center') || inner || document.body;
        const images: string[] = [];
        let imgBbcode = '';
        Array.from(imgScope.querySelectorAll('img')).forEach((img) => {
            const src = (img.getAttribute('src') || img.src || '').trim();
            if (!src || /tvdb|imdb|tmdb|favicon|logo|avatar|icon|star/i.test(src)) return;
            const cleanSrc = src.replace(/https?:\/\/filelist\.io\/redir\.php\?/gi, '');
            images.push(cleanSrc);
            const parent = img.parentElement as HTMLAnchorElement | null;
            if (parent && parent.tagName === 'A' && parent.href) {
                const cleanHref = parent.href.replace(/https?:\/\/filelist\.io\/redir\.php\?/gi, '');
                imgBbcode += `[url=${cleanHref}][img]${cleanSrc}[/img][/url]`;
            } else {
                imgBbcode += `[img]${cleanSrc}[/img]`;
            }
        });

        const tid = new URL(this.currentUrl).searchParams.get('id') || '';
        const mediainfo = await this.fetchMediaInfo(tid);
        let description = '';
        if (mediainfo) {
            description = `[quote]\n${mediainfo}\n[/quote]`;
        } else if (descrDiv) {
            description = htmlToBBCode(descrDiv).trim();
        }
        if (imgBbcode) {
            description = `${description}${description ? '\n\n' : ''}${imgBbcode}`.trim();
        }

        const dlAnchor = $('a[href^="download.php"], a[href*="download.php?id="]').first();
        const dlHref = dlAnchor.attr('href') || '';
        let torrentUrl = '';
        if (dlHref) {
            try {
                torrentUrl = new URL(dlHref, this.currentUrl).href;
            } catch {
                torrentUrl = dlHref;
            }
        }
        const torrentName = dlAnchor.text().trim() || (title ? `${title.replace(/\s+/g, '.')}.torrent` : undefined);

        const blob = `${title} ${categoryText} ${mediainfo}`;
        return {
            title,
            description,
            fullMediaInfo: mediainfo || undefined,
            type,
            mediumSel: getMediumSel(blob, title),
            standardSel: getStandardSel(blob),
            codecSel: getCodecSel(blob),
            audioCodecSel: getAudioCodecSel(blob),
            sourceSite: this.siteName,
            sourceUrl: this.currentUrl,
            imdbUrl: imdbUrl || undefined,
            imdbId: imdbId || undefined,
            tmdbUrl: tmdbUrl || undefined,
            tmdbId: tmdbId || undefined,
            images,
            torrentUrl: torrentUrl || undefined,
            torrentFilename: torrentName,
            torrentName
        };
    }

    async fill(_meta: TorrentMeta): Promise<void> {
        // FileList is source-only.
    }
}
