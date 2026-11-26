import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { extractDoubanId, extractImdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getLabel, getMediumSel, getStandardSel, getType } from '../common/rules/text';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { dispatchFormEvents, readFieldValue, setFirstFormValue } from '../common/dom/form';
import { hasIdQuery, isPage } from '../common/rules/pages';
import { GMAdapter } from '../services/GMAdapter';

const HDROUTE_TYPE_MAP: Record<string, number> = {
    电影: 1,
    剧集: 3,
    动漫: 4,
    综艺: 9,
    音乐: 8,
    纪录: 2,
    体育: 6,
    软件: 9,
    学习: 9
};

const HDROUTE_AUDIO_MAP: Record<string, number> = {
    TrueHD: 3,
    Atmos: 3,
    DTS: 4,
    'DTS-HD': 2,
    'DTS-HDMA': 2,
    'DTS-HDMA:X 7.1': 2,
    AC3: 5,
    LPCM: 1,
    Flac: 7,
    MP3: 6,
    AAC: 9,
    APE: 6,
    '': 8
};

const HDROUTE_STANDARD_MAP: Record<string, number> = {
    '4K': 5,
    '1080p': 1,
    '1080i': 2,
    '720p': 3,
    SD: 4,
    '': 4
};

function setSelectIndex(id: string, index: number) {
    const el = document.getElementById(id) as HTMLSelectElement | null;
    if (!el || !el.options[index]) return;
    el.selectedIndex = index;
    el.options[index].selected = true;
    dispatchFormEvents(el);
}

function extractChineseTitleFromMeta(meta: TorrentMeta): string {
    const descr = meta.description || '';
    const lines = descr.match(/(?:译|片)\s*?名[^\r\n]*/g) || [];
    for (const line of lines) {
        const name = line.split(/(?:译|片).*?名/).pop()?.split('/')[0]?.trim() || '';
        if (/[\u4e00-\u9fa5]/.test(name)) return name;
    }
    const sub = (meta.smallDescr || meta.subtitle || '').trim();
    if (sub) return sub.split('/', 1)[0].trim();
    return '';
}

function stripLeadingPostersForHdroute(rawDescr: string): string {
    const parts = rawDescr.split(/◎/);
    if (parts.length > 1) {
        parts.splice(0, 1);
        return '◎' + parts.join('◎');
    }
    let out = rawDescr.trim();
    while (out.indexOf('[img]') > -1 && out.indexOf('[img]') < 90) {
        const end = out.indexOf('[/img]');
        if (end < 0) break;
        out = out.slice(end + 6).trim();
    }
    return out;
}

export class HDRouteEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    isFillComplete(): boolean {
        const eng = readFieldValue(['#title_eng', 'input[name="title_eng"]']);
        const descr = readFieldValue(['textarea[name="descr"]', '#descr']);
        return !!eng && descr.length > 20;
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing HDRoute page...');
        const title =
            $('.details-title-eng').first().text().trim() ||
            $('.torrent-title-eng, h1').first().text().trim() ||
            document.title.replace(/\s*-\s*HDRoute.*$/i, '').trim();
        const chsTitle = $('.details-title-chs').first().text().trim();
        const subTitle = $('.details-title-sub').first().text().trim();
        const smallDescr = [chsTitle, subTitle].filter(Boolean).join(' / ') || subTitle || chsTitle;

        const html = document.body.innerHTML || '';
        const imdbUrl = matchLink('imdb', html) || '';
        const imdbId = extractImdbId(imdbUrl);
        const doubanUrl = matchLink('douban', html) || '';
        const doubanId = extractDoubanId(doubanUrl);

        let torrentUrl = '';
        const onclick = String($('.buttonDownload').first().attr('onclick') || '');
        const onclickMatch = onclick.match(/download[^'"\s)]*id=\d+/i);
        const dlHref = onclickMatch?.[0] || $('a[href*="download.php"]').first().attr('href') || '';
        if (dlHref) {
            try {
                torrentUrl = new URL(dlHref, this.currentUrl).href;
            } catch {
                torrentUrl = dlHref;
            }
        }

        const descrEl =
            document.getElementById('kdescr') ||
            document.querySelector('.details-descr, .torrent-descr, .details-main, #details-descr') as HTMLElement | null;
        let description = descrEl ? htmlToBBCode(descrEl) : '';
        if (!description) {
            const quoted = Array.from(document.querySelectorAll('.quoted, blockquote, pre'))
                .map((el) => (el.textContent || '').trim())
                .filter((t) => /General|Unique ID|DISC INFO|Video/i.test(t));
            if (quoted.length) {
                description = `[quote]\n${quoted[0]}\n[/quote]`;
            }
        }

        const images: string[] = [];
        const imgScope = descrEl || document.body;
        Array.from(imgScope.querySelectorAll('img')).forEach((img) => {
            const src = img.getAttribute('data-src') || img.getAttribute('src') || img.src || '';
            if (!src || /favicon|logo|avatar|icon|smiley|button|star/i.test(src)) return;
            if (!images.includes(src)) images.push(src);
        });

        const info = getMediainfoPictureFromDescr(description);
        const blob = `${title} ${smallDescr} ${document.querySelector('.details-info, .torrent-info')?.textContent || ''} ${description}`;
        const torrentFilename = title ? `${title.replace(/\s+/g, '.')}.torrent` : undefined;

        return {
            title,
            subtitle: smallDescr || undefined,
            smallDescr: smallDescr || undefined,
            description,
            fullMediaInfo: info.mediainfo || undefined,
            type: getType(blob) || '电影',
            mediumSel: getMediumSel(blob, title),
            standardSel: getStandardSel(blob),
            codecSel: getCodecSel(blob),
            audioCodecSel: getAudioCodecSel(blob),
            sourceSite: this.siteName,
            sourceUrl: this.currentUrl,
            imdbUrl: imdbUrl || undefined,
            imdbId: imdbId || undefined,
            doubanUrl: doubanUrl || undefined,
            doubanId: doubanId || undefined,
            images,
            torrentUrl: torrentUrl || undefined,
            torrentFilename,
            torrentName: torrentFilename
        };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling HDRoute upload form...');

        const titleChsEl = document.getElementById('title_chs') as HTMLInputElement | null;
        if (titleChsEl && !titleChsEl.value) {
            const chs = extractChineseTitleFromMeta(meta);
            if (chs) {
                titleChsEl.value = chs;
                dispatchFormEvents(titleChsEl);
            }
        }

        const smallDescr = (meta.smallDescr || meta.subtitle || '').trim();
        if (smallDescr) {
            setFirstFormValue('input[name="title_sub"]', smallDescr, { force: true });
            const oneSentence = smallDescr.match(/【(.*?版原盘)】/)?.[1] || smallDescr.match(/.版原盘/)?.[0] || '';
            if (oneSentence) {
                setFirstFormValue('input[name="title_one_sentence"]', oneSentence, { force: true });
            }
        }

        const engTitle = (meta.targetTitle || meta.title || '').trim();
        if (engTitle) {
            setFirstFormValue('#title_eng, input[name="title_eng"]', engTitle, { force: true });
        }

        // Description (strip leading poster per HDRoute rule) + copy helper
        const cleanedDescr = stripLeadingPostersForHdroute(meta.description || '');
        if (cleanedDescr) {
            setFirstFormValue('textarea[name="descr"], #descr', cleanedDescr, { force: true });
            if (!document.getElementById('copy_intro')) {
                const header = $('div.upload-title-name:contains(资源描述)').last();
                if (header.length) {
                    header.append(
                        ` <a href="#" style="text-decoration:none" id="copy_intro">=>复制描述</a>` +
                        `<font color="red"> 提示：如果描述填写失败请复制之后转换源码手动填写再预览。</font>`
                    );
                    $('#copy_intro').on('click', (e) => {
                        e.preventDefault();
                        GMAdapter.setClipboard(cleanedDescr);
                        $('#copy_intro').text('=>复制成功');
                    });
                }
            }
        }

        // Category / Audio / Codec / Medium / Resolution dropdowns (legacy indices)
        if (meta.type && HDROUTE_TYPE_MAP[meta.type] !== undefined) {
            setSelectIndex('type_category', HDROUTE_TYPE_MAP[meta.type]);
        }
        const audioKey = meta.audioCodecSel || '';
        if (HDROUTE_AUDIO_MAP[audioKey] !== undefined) {
            setSelectIndex('type_audio', HDROUTE_AUDIO_MAP[audioKey]);
        }

        const codecIdxMap: Record<string, number> = {
            H264: 1, X264: 1,
            'VC-1': 2,
            'MPEG-2': 3,
            XVID: 4,
            H265: 7, X265: 7
        };
        setSelectIndex('type_codec', codecIdxMap[meta.codecSel || ''] ?? 5);

        const mediumIdxMap: Record<string, number> = {
            UHD: 1, 'Blu-ray': 1,
            Remux: 2,
            HDTV: 3,
            Encode: 4,
            CD: 5,
            DVD: 6, 'WEB-DL': 6
        };
        setSelectIndex('type_medium', mediumIdxMap[meta.mediumSel || ''] ?? 6);

        const stdKey = meta.standardSel || '';
        if (HDROUTE_STANDARD_MAP[stdKey] !== undefined) {
            setSelectIndex('type_resolution', HDROUTE_STANDARD_MAP[stdKey]);
        }

        // Brief introduction
        const introEl = document.getElementById('upload_introduction') as HTMLTextAreaElement | null;
        const introMatch = (meta.description || '').match(/简\s*?介([\s\S]+?)\[quote\]/i);
        if (introEl && introMatch?.[1]) {
            let intro = introMatch[1].trim();
            if (/◎获奖情况|\[size=3\]\[color=#ff0000\]/.test(intro)) {
                intro = intro.split(/◎获奖情况|\[size=3\]\[color=#ff0000\]/)[0].trim();
            }
            intro = intro.replace(/\[.*?\]/g, '').trim();
            if (intro) {
                introEl.value = '　　' + intro;
                dispatchFormEvents(introEl);
            }
        }

        // Poster
        const firstImg = (meta.description || '').match(/\[img\](\S*?)\[\/img\]/i)?.[1] || meta.images?.[0] || '';
        if (firstImg) {
            setFirstFormValue('input[name="poster_big"]', firstImg, { force: true });
            setFirstFormValue('input[name="poster"]', firstImg, { force: true });
        }

        // IMDb score & numeric ID
        const rating = (meta.description || '').match(/IMDb评分.*?(\d+(?:\.\d)?)\/10/)?.[1]?.trim();
        if (rating) {
            setFirstFormValue('#upload-imdb, input[name="imdb"]', rating, { force: true });
        }
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        const imdbNo = imdbId.match(/tt(\d+)/i)?.[1] || '';
        if (imdbNo) {
            setFirstFormValue('#upload-imdb_url, input[name="imdb_url"]', imdbNo, { force: true });
        }

        // Audio/DIY flags
        const labels = meta.labelInfo || getLabel(`${meta.title || ''} ${smallDescr} ${meta.description || ''}`);
        const checkByName = (name: string, on: boolean) => {
            if (!on) return;
            const el = document.getElementsByName(name)[0] as HTMLInputElement | undefined;
            if (el) {
                el.checked = true;
                dispatchFormEvents(el);
            }
        };
        checkByName('is_mandrain', !!labels.gy);
        checkByName('is_cantonese', !!labels.yy);
        checkByName('is_diyed', !!labels.diy);

        // Torrent injection
        if (meta.torrentBase64 || meta.torrentUrl) {
            try {
                const { TorrentService } = await import('../services/TorrentService');
                const announce = $('input[value*="announce"]').first().val() as string | undefined;
                const result = await TorrentService.buildForwardTorrentFile(meta, 'HDRoute', announce || null);
                if (result) {
                    TorrentService.injectTorrentForSite('HDRoute', result.file, result.filename);
                }
            } catch (e) {
                console.error('[Auto-Feed][HDRoute] File Injection Failed:', e);
            }
        }
    }
}
