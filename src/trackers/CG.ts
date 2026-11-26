import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { extractImdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel } from '../common/rules/text';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { dispatchFormEvents, readFieldValue, setFirstFormValue } from '../common/dom/form';
import { hasIdQuery, isPage } from '../common/rules/pages';

const CG_ANNOUNCE = 'http://tracker.cinemageddon.net:2086/announce.php';

export class CGEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    isFillComplete(): boolean {
        const name = readFieldValue(['input[name="name"]']);
        const mi = readFieldValue(['textarea[name="mediainfo"]']);
        const descr = readFieldValue(['textarea[name="descr"]']);
        return !!name && (mi.length > 20 || descr.length > 20);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing CG page...');
        const title = ($('h1').first().text() || document.title || '')
            .replace(/Cinemageddon\s*\/\/\s*/i, '')
            .trim();
        const detailsEl = document.getElementById('torrent_details') || document.body;
        const detailsHtml = detailsEl.innerHTML || '';
        const imdbUrl = matchLink('imdb', detailsHtml) || matchLink('imdb', document.body.innerHTML) || '';
        const imdbId = extractImdbId(imdbUrl);

        const description = htmlToBBCode(detailsEl as HTMLElement).trim();
        const infos = getMediainfoPictureFromDescr(description);

        const images: string[] = [];
        Array.from(detailsEl.querySelectorAll('img')).forEach((img) => {
            const src = (img.getAttribute('src') || img.src || '').trim();
            if (!src || /cinemageddon\.net\/(?:pic|styles|images)/i.test(src)) return;
            if (!images.includes(src)) images.push(src);
        });

        const dlHref =
            $('#torrent_details').parent().find('a[href*="download.php?id="]').first().attr('href') ||
            $('a[href*="download.php?id="]').first().attr('href') ||
            '';
        let torrentUrl = '';
        if (dlHref) {
            try { torrentUrl = new URL(dlHref, this.currentUrl).href; } catch { torrentUrl = dlHref; }
        }
        const torrentFilename = title ? `${title.replace(/\s+/g, '.')}.torrent` : undefined;
        const blob = `${title} ${description}`;

        return {
            title,
            description,
            fullMediaInfo: infos.mediainfo || undefined,
            type: '电影',
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

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling CG upload form...');
        const title = (meta.targetTitle || meta.title || '').trim();
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
        const year = title.match(/\b((?:19|20)\d{2})\b/)?.[1] || (meta.description || '').match(/年代[^\d]*((?:19|20)\d{2})/)?.[1] || '';

        if (title) setFirstFormValue('input[name="name"]', title, { force: true });
        if (year) setFirstFormValue('input[name="year"]', year, { force: true });
        if (imdbId) setFirstFormValue('input[name="imdb"]', imdbId, { force: true });

        const setSelect = (name: string, val: string) => {
            const sel = document.querySelector(`select[name="${name}"]`) as HTMLSelectElement | null;
            if (!sel || !val) return;
            const opt = Array.from(sel.options).find(
                (o) => o.value.toLowerCase() === val.toLowerCase() || o.textContent?.trim().toLowerCase() === val.toLowerCase()
            );
            if (opt) {
                sel.value = opt.value;
                dispatchFormEvents(sel);
            }
        };

        // Source dropdown
        const medium = meta.mediumSel || '';
        if (/webrip/i.test(title)) setSelect('source', 'WEBRIP');
        else if (medium === 'UHD' || medium === 'Blu-ray') setSelect('source', 'Other');
        else if (medium === 'Encode' || medium === 'Remux') setSelect('source', 'BDRIP');
        else if (medium === 'HDTV') setSelect('source', 'TVRIP');
        else if (medium === 'WEB-DL') setSelect('source', 'WEB-DL');
        else if (medium === 'DVD') setSelect('source', 'DVDRIP');

        // Format dropdown (`fmt`)
        const codec = meta.codecSel || '';
        if (medium === 'Blu-ray' || medium === 'UHD') {
            setSelect('fmt', /bd25/i.test(title) ? 'BD25' : 'BD50');
        } else if (medium === 'DVD' && !/dvdrip/i.test(title)) {
            setSelect('fmt', 'DVD-R');
        } else if (codec === 'H264' || codec === 'X264') {
            setSelect('fmt', 'x264');
        } else if (codec === 'H265' || codec === 'X265') {
            setSelect('fmt', 'Other');
        } else if (codec === 'XVID') {
            setSelect('fmt', 'XViD');
        } else if (codec === 'MPEG-2') {
            setSelect('fmt', 'MPEG2');
        }

        // Category (`type`) & Country (`country`)
        if (meta.type === '纪录') setSelect('type', '15');
        else if (meta.type === '书籍') setSelect('type', '19');
        else if (meta.type === '音乐') setSelect('type', '11');

        const countryMap: Record<string, string> = {
            大陆: 'China', 香港: 'Hong Kong', 日本: 'Japan', 韩国: 'South Korea', 印度: 'India', 泰国: 'Thailand'
        };
        if (meta.sourceSel && countryMap[meta.sourceSel]) {
            setSelect('country', countryMap[meta.sourceSel]);
        }

        // HD dropdown (`hd`)
        if (meta.standardSel === '720p') setSelect('hd', '720p');
        else if (meta.standardSel === '1080p' || meta.standardSel === '1080i') setSelect('hd', '1080p');

        // MediaInfo & Description (separated cleanly per live CG upload.php)
        const infos = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
        const mi = (meta.fullMediaInfo || infos.mediainfo || '').replace(/\[\/?(quote|code)[^\]]*\]/gi, '').trim();
        if (mi) setFirstFormValue('textarea[name="mediainfo"]', mi, { force: true });

        const pics = (infos.picInfo || '').trim();
        const descrBody = pics || (meta.description || '').trim();
        if (descrBody) setFirstFormValue('textarea[name="descr"]', descrBody, { force: true });

        // Torrent file injection
        if (meta.torrentBase64 || meta.torrentUrl) {
            try {
                const { TorrentService } = await import('../services/TorrentService');
                const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, CG_ANNOUNCE);
                const fileInput = document.querySelector('input[type="file"][name="file"]') as HTMLInputElement | null;
                if (result && fileInput) {
                    TorrentService.injectFileIntoInput(fileInput, result.file);
                }
            } catch (e) {
                console.error('[Auto-Feed][CG] File Injection Failed:', e);
            }
        }
    }
}
