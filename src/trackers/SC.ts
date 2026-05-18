import $ from 'jquery';
import { GazelleEngine } from './Gazelle';
import { TorrentMeta } from '../types/TorrentMeta';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { extractImdbId } from '../common/rules/links';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { dispatchFormEvents } from '../common/dom/form';

function setField(selector: string, value?: string) {
    if (!value) return;
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!el) return;
    el.value = value;
    dispatchFormEvents(el);
}

function normalizeMediaValue(meta: TorrentMeta): string {
    const medium = meta.mediumSel || meta.medium || '';
    const standard = meta.standardSel || meta.resolution || '';
    if (/Blu.?ray|UHD/i.test(medium)) return 'BDMV';
    if (/DVD/i.test(medium)) return /DVDRip/i.test(meta.title || '') ? 'SD' : 'DVD-R';
    if (/2160|4K/i.test(standard)) return '2160p';
    if (/1080/i.test(standard)) return '1080p';
    if (/720/i.test(standard)) return '720p';
    return 'SD';
}

export class SCEngine extends GazelleEngine {
    async parse(): Promise<TorrentMeta> {
        const meta = await super.parse();
        const torrentId = this.currentUrl.match(/torrentid=(\d+)/i)?.[1] || this.currentUrl.match(/[?&]id=(\d+)/i)?.[1] || '';

        meta.type = '电影';
        if (torrentId) {
            const row = $(`#torrent${torrentId}, #torrent_${torrentId}`).first();
            const imdbHref = row.find('a[href*="imdb.com/title/tt"], a:contains("IMDB")').first().attr('href') || '';
            if (imdbHref) {
                meta.imdbUrl = imdbHref;
                meta.imdbId = extractImdbId(imdbHref);
            }

            const torrentBox = $(`#torrent_${torrentId}, #torrent${torrentId}`).first();
            const quote = torrentBox.find('blockquote').has('blockquote').last();
            if (quote.length) {
                const innerQuote = quote.find('blockquote').first();
                let description = '';
                const quoteText = (innerQuote.text() || '').trim();
                if (quoteText) description += `[quote]${quoteText}[/quote]\n\n`;
                quote.find('img').each((_, img) => {
                    const src = (img as HTMLImageElement).getAttribute('src') || (img as HTMLImageElement).src || '';
                    if (src) {
                        description += `[img]${src}[/img]\n`;
                        meta.images.push(src);
                    }
                });
                if (description.trim()) meta.description = description.trim();
            } else if (torrentBox.length) {
                const converted = htmlToBBCode(torrentBox[0]);
                if (converted) meta.description = converted;
            }

            const name = meta.description.match(/complete.*?name.*?:\s*(.*)/i)?.[1]?.trim();
            if (name) meta.title = name;

            const download = $(`a[href*="download&id=${torrentId}"], a[href*="download.php?id=${torrentId}"], a[href*="download.php"][href*="${torrentId}"]`).first().attr('href') || '';
            if (download) {
                meta.torrentUrl = new URL(download, this.currentUrl).href;
            }
        }

        const poster = $('#covers img, #cover_div img, .box_image img').first().attr('src') || '';
        if (poster) {
            meta.images = [poster, ...meta.images.filter((x) => x !== poster)];
        }
        if (!meta.imdbId && meta.imdbUrl) meta.imdbId = extractImdbId(meta.imdbUrl);
        return meta;
    }

    async fill(meta: TorrentMeta): Promise<void> {
        await super.fill(meta);

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        setField('#catalogue_number, #cataloguenumber', imdbId);
        const imdbAuto = document.querySelector('#imdb_autofill') as HTMLButtonElement | HTMLInputElement | null;
        try { imdbAuto?.click(); } catch {}

        setField('#media, select[name="media"]', normalizeMediaValue(meta));
        const info = getMediainfoPictureFromDescr(`${meta.fullMediaInfo || ''}\n${meta.description || ''}`, { mediumSel: meta.mediumSel });
        const screenshots = (info.picInfo || '')
            .match(/(\[url=.*?\])?\[img\].*?\[\/img\](\[\/url\])?/gi)
            ?.slice(0, 3)
            .join('') || '';
        const mediainfo = meta.fullMediaInfo || info.mediainfo || '';
        const releaseDesc = [screenshots, mediainfo ? `[hide=MediaInfo]${mediainfo}[/hide]` : '']
            .filter(Boolean)
            .join('\n\n');
        setField('#release_desc, textarea[name="release_desc"], textarea[name="description"]', releaseDesc || meta.description);

        const image = meta.images?.[0] || meta.description.match(/\[img\](.*?)\[\/img\]/i)?.[1] || '';
        setField('input[name="image"], input#image', image);

        try {
            const { TorrentService } = await import('../services/TorrentService');
            const announce = ($('input[value*="announce"]').val() as string) || null;
            const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, announce);
            if (result) TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
        } catch (e) {
            console.error('[Auto-Feed][SC] File Injection Failed:', e);
        }
    }
}
