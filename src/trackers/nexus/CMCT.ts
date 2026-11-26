import $ from 'jquery';
import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { htmlToBBCode } from '../../utils/htmlToBBCode';
import { getMediainfoPictureFromDescr } from '../../common/rules/media';

import { getSourceSelFromDescr } from '../../common/rules/helpers';
import { repeat } from '../../common/dom/repeat';
import { getMetaLabels } from '../../common/rules/labels';
import { readFieldValue } from '../../common/dom/form';
import { stripLeadingPtgenBlock } from '../../services/PtgenService';

const retry = (fn: () => void, times = 8, delayMs = 220) => repeat(fn, times, delayMs);

export const buildCmctExtraDescr = (
    rawDescription: string,
    options?: {
        mediaInfo?: string;
        screenshotUrls?: string[];
        coverUrl?: string;
        hasExternalLink?: boolean;
    }
): string => {
    let extra = String(rawDescription || '').trim();
    if (!extra) return '';

    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mi = String(options?.mediaInfo || '').trim();
    if (mi) {
        extra = extra.replace(new RegExp(`\\[(?:quote|mediainfo|bdinfo|hide=mediainfo|hide=bdinfo)[^\\]]*\\]\\s*${esc(mi)}\\s*\\[\\/(?:quote|mediainfo|bdinfo|hide)\\]\\s*`, 'ig'), '\n');
    }
    // Strip any MediaInfo/BDInfo block already handled by `#Media_BDInfo`.
    extra = extra.replace(
        /\[(quote|code|mediainfo|bdinfo|hide|spoiler)(?:=[^\]]*)?\][\s\S]*?(?:General|Unique ID|Complete name|DISC INFO:|\.MPLS|Disc Label|Video Codec)[\s\S]*?\[\/\1\]/gi,
        '\n'
    );

    // Strip screenshot URLs already placed into `#url_vimages` and poster URLs already placed into `#url_poster` / Douban.
    const removeUrls = new Set<string>(
        [...(options?.screenshotUrls || []), options?.coverUrl || '']
            .map((u) => String(u || '').trim())
            .filter(Boolean)
    );
    extra = extra.replace(/(?:\[url=[^\]]+\])?\[img\](https?:\/\/[^\s\]]+)\[\/img\](?:\[\/url\])?/gi, (full, url: string) => {
        const cleanUrl = String(url || '').trim();
        if (removeUrls.has(cleanUrl)) return '';
        if (options?.hasExternalLink && /doubanio\.com\/view\/photo\//i.test(cleanUrl)) return '';
        return full;
    });

    // When CMCT has a Douban/IMDb URL in `#url`, CMCT renders the Douban info block itself;
    // strip the leading PTGen info block so `附加信息` only carries genuine extra notes / comparisons.
    if (options?.hasExternalLink) {
        extra = stripLeadingPtgenBlock(extra);
    }

    extra = extra
        .replace(/\[quote\]\s*\[\/quote\]/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return extra;
};

export const setCmctDescrValue = (value: string) => {
    const descrBox = document.querySelector('#descr, textarea[name="descr"]') as HTMLTextAreaElement | null;
    if (!descrBox) return;
    descrBox.value = value;
    descrBox.dispatchEvent(new Event('input', { bubbles: true }));
    descrBox.dispatchEvent(new Event('change', { bubbles: true }));

    try {
        const pageWin = (typeof (globalThis as any).unsafeWindow !== 'undefined'
            ? (globalThis as any).unsafeWindow
            : window) as any;
        const inst =
            pageWin?.sceditor?.instance?.(descrBox) ||
            (pageWin?.jQuery && pageWin.jQuery(descrBox)?.sceditor?.('instance')) ||
            ((window as any).sceditor?.instance?.(descrBox));
        if (inst && typeof inst.val === 'function') {
            inst.val(value);
            if (typeof inst.updateOriginal === 'function') inst.updateOriginal();
        }
    } catch {}

    try {
        const scTextarea = descrBox
            .closest('td, .bbcode-editor')
            ?.querySelector('.sceditor-container textarea') as HTMLTextAreaElement | null;
        if (scTextarea && scTextarea !== descrBox) {
            scTextarea.value = value;
            scTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            scTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
    } catch {}
};

const setById = (id: string, on: boolean) => {
    if (!on) return;
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el || el.type !== 'checkbox') return;
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
};

const setSelectValue = (selector: string, value: number) => {
    const el = document.querySelector(selector) as HTMLSelectElement | null;
    if (!el) return;
    el.value = String(value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
};

const checkInput = (selector: string, checked: boolean) => {
    if (!checked) return;
    const el = document.querySelector(selector) as HTMLInputElement | null;
    if (!el) return;
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
};

const buildCmctTitle = (raw: string) => {
    let t = (raw || '').trim();
    if (!t) return '';
    t = t
        .replace(/DDP/gi, 'DD+')
        .replace(/DTS[- .]?HD[\s-]?(?:Master\s*Audio|MA)/gi, 'DTS-HD MA')
        .replace(/DTS[- .]?HD[\s-]?(?:High\s*Resolution|HRA?|HR)/gi, 'DTS-HD HR')
        .replace(/([A-Za-z0-9])[ ]+-(?=[A-Za-z0-9])/g, '$1-')
        .replace(/-(?=[A-Za-z0-9])/g, '-');
    t = t.replace(
        /(DD\+|DD|AAC|TrueHD|DTS-HD MA|DTS-HD HR|DTS|LPCM|FLAC)\s*[. ]\s*(7\.1|5\.1|2\.0|1\.0)/gi,
        '$1 $2'
    );
    t = t.replace(/\s*-\s*/g, '-').replace(/\s+/g, '.').replace(/\.{2,}/g, '.');
    t = t.replace(/\.-/g, '-').replace(/-\./g, '-');
    return t.trim();
};

export class CMCTEngine extends NexusPHPEngine {
    protected async afterParse(meta: TorrentMeta): Promise<TorrentMeta> {
        try {
            const blocks: string[] = [];
            const screenSet = new Set<string>();

            const extraText = ($('.extra-text').first().text() || '').trim();
            if (extraText) {
                const wrapped = extraText.includes('[quote]') ? extraText : `[quote]\n${extraText}\n[/quote]`;
                blocks.push(wrapped.trim());
            }

            const poster = ($('#kposter img').first().attr('src') || '').trim();
            if (poster) blocks.push(`[img]${poster}[/img]`);

            const introEl =
                ($('.info.douban-info artical.copy').first()[0] as Element | undefined) ||
                ($('.info.douban-info article').first()[0] as Element | undefined) ||
                ($('.info.douban-info artical').first()[0] as Element | undefined) ||
                ($('.info.douban-info').first()[0] as Element | undefined);
            if (introEl) {
                let intro = htmlToBBCode(introEl, meta.sourceSite).trim();
                if (extraText && intro.includes(extraText)) intro = intro.replace(extraText, '').trim();
                intro = intro.replace(/\[img\][\s\S]*?\[\/img\]\s*/gi, '').trim();
                intro = intro.split('◎◎◎◎!!!!资料转载请注明出处!!!!◎◎◎◎')[0].trim();
                if (intro) blocks.push(intro);
            }

            const miEl = $('.codemain').eq(1)[0] as HTMLElement | undefined;
            let fullMediaInfo = '';
            if (miEl) fullMediaInfo = (miEl.innerText || $(miEl).text() || '').trim();
            if (fullMediaInfo) blocks.push(`[quote]${fullMediaInfo}[/quote]`);

            $('.screenshots-container img, #kscreenshots img').each((_, img) => {
                const src = ((img as HTMLImageElement).src || (img as HTMLImageElement).getAttribute('src') || '').trim();
                if (!src) return;
                if (src.includes('detail')) return;
                if (poster && src === poster) return;
                screenSet.add(src);
            });
            if (screenSet.size) {
                blocks.push(Array.from(screenSet).map((u) => `[img]${u}[/img]`).join('\n'));
            }

            const rebuilt = blocks.join('\n\n').trim();
            if (rebuilt) {
                meta.description = rebuilt;
                if (fullMediaInfo) meta.fullMediaInfo = fullMediaInfo;
            } else if ((meta.description || '').trim()) {
                const info = getMediainfoPictureFromDescr(meta.description || '');
                if (!fullMediaInfo && info.mediainfo) fullMediaInfo = info.mediainfo;
                const intro = (meta.description || '').split('[quote]')[0].replace(/\[img\][\s\S]*?\[\/img\]\s*/gi, '').trim();
                const shots = Array.from(new Set(
                    (info.picInfo.match(/\[img\]([^\[]+?)\[\/img\]/gi) || [])
                        .map((s) => s.replace(/\[img\]|\[\/img\]/gi, '').trim())
                        .filter(Boolean)
                        .filter((u) => !poster || u !== poster)
                ));
                meta.description = [intro, fullMediaInfo ? `[quote]${fullMediaInfo}[/quote]` : '', shots.map((u) => `[img]${u}[/img]`).join('\n')]
                    .filter(Boolean)
                    .join('\n\n')
                    .trim();
                if (fullMediaInfo) meta.fullMediaInfo = fullMediaInfo;
            }
        } catch { }
        return meta;
    }

    isFillComplete(): boolean {
        const name = readFieldValue(['input[name="name"]', '#name']);
        const mi = readFieldValue(['#Media_BDInfo', 'textarea[name="Media_BDInfo"]']);
        const shots = readFieldValue(['#url_vimages', 'textarea[name="url_vimages"]']);
        const descr = readFieldValue(['#descr', 'textarea[name="descr"]']);
        return !!name && (mi.length > 30 || shots.length > 10 || descr.length > 30);
    }

    protected async beforeFill(meta: TorrentMeta): Promise<TorrentMeta> {
        meta.title = buildCmctTitle(meta.title || '');
        if (meta.subtitle) meta.subtitle = meta.subtitle.replace(/【/g, '[').replace(/】/g, ']');
        if (meta.smallDescr) meta.smallDescr = meta.smallDescr.replace(/【/g, '[').replace(/】/g, ']');
        return meta;
    }

    protected async afterFill(meta: TorrentMeta): Promise<void> {
        let preferredLink = '';
        try {
            preferredLink =
                (meta.doubanUrl || '').trim() ||
                (meta.doubanId ? `https://movie.douban.com/subject/${meta.doubanId}/` : '') ||
                (meta.imdbUrl || '').trim() ||
                (meta.imdbId ? `https://www.imdb.com/title/${meta.imdbId}/` : '');
            if (preferredLink) {
                const linkInputs = Array.from(document.querySelectorAll('input[name="url"], input#url')) as HTMLInputElement[];
                linkInputs.forEach((input) => {
                    input.value = preferredLink;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }
        } catch {}

        try {
            const info = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
            const pickMi = () => {
                if (meta.fullMediaInfo) return meta.fullMediaInfo;
                return (info.mediainfo || '').trim();
            };
            let mi = pickMi();
            mi = mi.replace(/ReportBy[\s\S]*$/i, '').replace(/Report created by[\s\S]*$/i, '').trim();

            const miBox = document.querySelector('#Media_BDInfo, textarea[name="Media_BDInfo"]') as HTMLTextAreaElement | null;
            if (miBox && mi) {
                miBox.value = mi;
                miBox.dispatchEvent(new Event('input', { bubbles: true }));
                miBox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const cover = (info.coverImg || '').replace(/\[img\]|\[\/img\]/gi, '').trim();
            const posterBox = document.querySelector('#url_poster, input[name="url_poster"]') as HTMLInputElement | null;
            // CMCT explicitly instructs: leave poster blank to use Douban/IMDb poster; avoid hotlink-blocked doubanio URLs when `#url` is set.
            const skipDoubanHotlink = !!preferredLink && /doubanio\.com/i.test(cover);
            if (posterBox && cover && !skipDoubanHotlink && !posterBox.value.trim()) {
                posterBox.value = cover;
                posterBox.dispatchEvent(new Event('input', { bubbles: true }));
                posterBox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const imgUrls = Array.from(new Set(
                (info.picInfo || '')
                    .match(/\[img\]([^\[]+?)\[\/img\]/gi)
                    ?.map((s) => s.replace(/\[img\]|\[\/img\]/gi, '').trim())
                    .filter(Boolean)
                    .filter((u) => !cover || u !== cover) || []
            ));
            const urlBox = document.querySelector('#url_vimages, textarea[name="url_vimages"]') as HTMLTextAreaElement | HTMLInputElement | null;
            if (urlBox && imgUrls.length) {
                urlBox.value = imgUrls.join('\n');
                urlBox.dispatchEvent(new Event('input', { bubbles: true }));
                urlBox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Keep CMCT `附加信息` (`#descr` + SCEditor) clean: strip MediaInfo, `#url_vimages` screenshots,
            // poster, and auto-rendered Douban PTGen block, leaving only genuine extra notes / comparisons.
            const extra = buildCmctExtraDescr(meta.description || '', {
                mediaInfo: miBox ? mi : '',
                screenshotUrls: urlBox ? imgUrls : [],
                coverUrl: cover,
                hasExternalLink: !!preferredLink
            });
            setCmctDescrValue(extra);
            repeat(() => setCmctDescrValue(extra), 4, 300);
        } catch { }

        retry(() => {
            const nameBlob = `${meta.title || ''} ${meta.subtitle || ''} ${meta.smallDescr || ''}`;
            const descrBlob = `${meta.description || ''}\n${meta.fullMediaInfo || ''}`;

            const typeDict: Record<string, number> = {
                电影: 501,
                剧集: 502,
                综艺: 505,
                音乐: 508,
                纪录: 503,
                有声小说: 510,
                体育: 506,
                软件: 509,
                学习: 509,
                MV: 507,
                书籍: 509
            };
            let browsecat = typeDict[meta.type || ''] ?? 509;
            if (meta.type === '动漫') {
                checkInput('#animation, input[name="animation"]', true);
                browsecat = /S\d+[^E]/i.test(nameBlob) ? 502 : 501;
            }
            setSelectValue('select[name="browsecat"], #browsecat', browsecat);

            if ((meta.type === '剧集' || meta.type === '动漫') && /S\d+[^E]/i.test(nameBlob)) {
                checkInput('input[name="pack"], #pack', true);
            }

            let medium = 99;
            switch (meta.mediumSel) {
                case 'UHD':
                case 'Blu-ray':
                    medium = 1;
                    break;
                case 'Remux':
                    medium = 4;
                    break;
                case 'HDTV':
                    medium = 5;
                    break;
                case 'WEB-DL':
                    medium = /webrip/i.test(nameBlob) ? 8 : 7;
                    break;
                case 'Encode':
                    medium = 6;
                    break;
                case 'DVD':
                    medium = /dvdrip/i.test(nameBlob) ? 10 : 3;
                    break;
                case 'CD':
                    medium = 11;
                    break;
            }
            setSelectValue('select[name="medium_sel"]', medium);

            let codec = 99;
            switch (meta.codecSel) {
                case 'H265':
                case 'X265':
                    codec = 1;
                    break;
                case 'H264':
                case 'X264':
                    codec = 2;
                    break;
                case 'VC-1':
                    codec = 3;
                    break;
                case 'MPEG-2':
                    codec = 4;
                    break;
                case 'AV1':
                    codec = 5;
                    break;
            }
            setSelectValue('select[name="codec_sel"]', codec);

            let audio = 99;
            switch (meta.audioCodecSel) {
                case 'DTS-HD':
                case 'DTS-HDMA:X 7.1':
                case 'DTS-X':
                case 'DTS-HDMA':
                case 'DTS-HDHR':
                    audio = 1;
                    break;
                case 'TrueHD':
                case 'Atmos':
                    audio = 2;
                    break;
                case 'LPCM':
                    audio = 6;
                    break;
                case 'DTS':
                    audio = 3;
                    break;
                case 'AC3':
                    audio = /DD[\+p]/i.test(nameBlob) ? 11 : 4;
                    break;
                case 'AAC':
                    audio = 5;
                    break;
                case 'Flac':
                    audio = 7;
                    break;
                case 'APE':
                    audio = 8;
                    break;
                case 'WAV':
                    audio = 9;
                    break;
                case 'MP3':
                    audio = 10;
                    break;
                case 'OPUS':
                    audio = 12;
                    break;
            }
            setSelectValue('select[name="audiocodec_sel"]', audio);

            const standardDict: Record<string, number> = { '4K': 1, '1080p': 2, '1080i': 3, '720p': 4, SD: 5, '': 0 };
            setSelectValue('select[name="standard_sel"]', standardDict[meta.standardSel || ''] ?? 0);

            let region = (meta.sourceSel || '').trim();
            if (!region) {
                region = getSourceSelFromDescr(meta.description || '') || getSourceSelFromDescr(meta.fullMediaInfo || '');
            }
            if (region === '港台') {
                const parsed = getSourceSelFromDescr(meta.description || '');
                region = parsed === '台湾' ? '台湾' : '香港';
            } else if (region === '日韩') {
                const parsed = getSourceSelFromDescr(meta.description || '');
                region = parsed === '日本' ? '日本' : '韩国';
            }

            const sourceDict: Record<string, number> = {
                欧美: 4,
                大陆: 1,
                香港: 2,
                台湾: 3,
                日本: 5,
                韩国: 6,
                印度: 7,
                泰国: 9
            };
            let source = sourceDict[region] ?? 99;
            if (/◎(地.{0,10}?区|国.{0,10}?家|产.{0,10}?地|◎產.{0,5}?地).*(俄罗斯|苏联)/i.test(descrBlob)) {
                source = 8;
            }
            setSelectValue('select[name="source_sel"], #source_sel', source);
        });

        try {
            const labels = getMetaLabels(meta);
            retry(() => {
                setById('mandarin', !!labels.gy);
                setById('subtitlezh', !!labels.zz);
                if (!labels.diy && /mpls/i.test(`${meta.description || ''}${meta.fullMediaInfo || ''}`)) {
                    setById('untouched', true);
                }
                setById('hdr10', !!labels.hdr10);
                setById('hdr10plus', !!labels.hdr10plus);
                setById('dovi', !!labels.db);
                setById('3d', /(\.| )3D(\.| )/i.test(meta.title || ''));
                setById('hlg', /HLG/i.test(meta.title || ''));
                setById('pack', !!labels.complete);
                setById('subtitlesp', /(特效字幕)/.test(meta.smallDescr || meta.subtitle || ''));
                setById('hdrvivid', /HDR Vivid/i.test(`${meta.description || ''}${meta.fullMediaInfo || ''}`));
            });
        } catch { }
    }
}
