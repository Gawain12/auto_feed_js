import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { extractImdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel, getType } from '../common/rules/text';

export class TorrentLeechEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return /^\/torrent\/\d+/i.test(url.pathname);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing TorrentLeech page...');
        const rawTitle = ($('#torrentnameid').text() || $('h1, h3').first().text() || document.title || '');
        const title = rawTitle.replace(/freeleech/gi, '').replace(/\s+/g, ' ').trim();

        const imdbBox = document.querySelector('.torrent-main.row.mt-30') || document.body;
        const imdbUrl = matchLink('imdb', imdbBox.innerHTML || '') || '';
        const imdbId = extractImdbId(imdbUrl);

        let categoryText = '';
        const table = document.querySelector('table.table.borderless');
        if (table) {
            const tds = Array.from(table.querySelectorAll('td'));
            for (let i = 0; i < tds.length - 1; i++) {
                if ((tds[i].textContent || '').trim() === 'Category') {
                    categoryText = (tds[i + 1].textContent || '').trim();
                    break;
                }
            }
        }

        let type = getType(`${categoryText} ${title}`) || '电影';
        if (/(DVDRip|webrip|HDRIP|BLURAY|DVDR|4K)/i.test(categoryText)) type = '电影';
        else if (/Episodes/i.test(categoryText)) type = '剧集';
        else if (/documentaries/i.test(categoryText)) type = '纪录';
        if (/S\d+/i.test(title)) type = '剧集';

        const nfoBox = document.getElementById('nfo_text');
        const mediainfo = nfoBox ? htmlToBBCode(nfoBox.cloneNode(true) as HTMLElement).trim() : '';

        const images: string[] = [];
        let imgBbcode = '';
        const gallery = document.querySelector('.galleryContents');
        if (gallery) {
            Array.from(gallery.querySelectorAll('img')).forEach((img) => {
                const src = (img.getAttribute('src') || img.src || '').trim();
                if (!src) return;
                if (/i\.ibb\.co.*\.png|i\.imgur\.com.*\.(png|jpg)|funkyimg\.com\/i\/38aAB\.png/i.test(src)) return;
                images.push(src);
                const parent = img.parentElement as HTMLAnchorElement | null;
                if (parent && parent.tagName === 'A' && parent.href) {
                    imgBbcode += `[url=${parent.href}][img]${src}[/img][/url]\n`;
                } else {
                    imgBbcode += `[img]${src}[/img]\n`;
                }
            });
        }

        const description = `${mediainfo ? `[quote]\n${mediainfo}\n[/quote]\n\n` : ''}${imgBbcode}`
            .replace(/\[\/?color[^\]]*\]/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        const dlHref =
            $('#detailsDownloadButton').attr('href') ||
            $('a[href*="/download/"]').first().attr('href') ||
            '';
        let torrentUrl = '';
        if (dlHref) {
            try {
                torrentUrl = new URL(dlHref, this.currentUrl).href;
            } catch {
                torrentUrl = dlHref;
            }
        }
        const torrentFilename = title ? `${title.replace(/\s+/g, '.')}.torrent` : undefined;

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
            images,
            torrentUrl: torrentUrl || undefined,
            torrentFilename,
            torrentName: torrentFilename
        };
    }

    async fill(_meta: TorrentMeta): Promise<void> {
        // TorrentLeech is source-only.
    }
}
