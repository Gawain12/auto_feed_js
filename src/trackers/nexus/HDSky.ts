import $ from 'jquery';
import { getSmallDescrFromDescr } from '../../common/rules/helpers';
import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { getLabel } from '../../common/rules/text';
import { repeat } from '../../common/dom/repeat';

export class HDSkyEngine extends NexusPHPEngine {
    protected async beforeFill(meta: TorrentMeta): Promise<TorrentMeta> {
        const small = buildHDSkySmallDescr(meta);
        if (small) {
            meta.smallDescr = small;
            meta.subtitle = small;
        }
        return meta;
    }

    protected async afterFill(meta: TorrentMeta): Promise<void> {
        repeat(() => {
            try {
                const small = meta.subtitle || meta.smallDescr || '';
                const descr = meta.description || '';
                const labelText = `${small}${meta.title || ''}#separator#${descr}${meta.fullMediaInfo || ''}`;
                const labels = meta.labelInfo || getLabel(labelText);
                applyHDSkyOptions(labels, small, descr, meta.title || '');
                fillHDSkySelects(meta);
            } catch { }
        }, 6, 250);
    }
}

function buildHDSkySmallDescr(meta: TorrentMeta): string {
    const title = meta.title || '';
    const descr = meta.description || '';

    // Prefer existing small_descr, otherwise derive one from description (legacy helper).
    let small = (meta.subtitle || meta.smallDescr || '').trim();
    if (!small && descr) small = getSmallDescrFromDescr(descr, title);
    if (!small) return '';

    // Legacy: strip " | 类别：" and keep bracketed extra info if present.
    const parts = small.split('| 类别：');
    if (parts.length > 1) {
        const plus = (parts[1] || '').replace(/【/g, '[').replace(/】/g, ']');
        const tag = plus.match(/\[[^\]]+\]/)?.[0] || '';
        small = (parts[0] || '').trim() + (tag ? ` ${tag}` : '');
    } else {
        small = parts[0].trim();
    }

    // Normalize slashes spacing.
    small = small.replace(/(\s\/)/gi, '/').replace(/(\/\s)/gi, '/').trim();

    // Legacy: add category prefix for documentary/anime.
    if (meta.type === '纪录' && !small.startsWith('[纪录]')) {
        small = `[纪录] ${small}`;
    } else if (meta.type === '动漫' && !small.startsWith('[动画]') && !small.startsWith('[動漫]')) {
        small = `[动画] ${small}`;
    }

    // Legacy: for TV series, append season/episode info in brackets based on title and (sometimes) descr.
    if (meta.type === '剧集') {
        const hasSeason = /\[第\d+(-\d+)?季\]/.test(small);
        const hasEpisode = /\[第\d+(-\d+)?集\]/.test(small);

        if (!hasSeason) {
            const range = title.match(/S(\d{1,3})\s*[-~]\s*S?(\d{1,3})/i);
            if (range) {
                const s1 = parseInt(range[1], 10);
                const s2 = parseInt(range[2], 10);
                if (Number.isFinite(s1) && Number.isFinite(s2)) small += ` [第${s1}-${s2}季]`;
            } else {
                const s = title.match(/S(\d{1,3})/i);
                if (s) {
                    const season = parseInt(s[1], 10);
                    if (Number.isFinite(season)) {
                        small += ` [第${season}季]`;
                        if (!title.match(/E(P)?\d{1,4}/i)) {
                            const total = descr.match(/◎集.*?数.*?(\d+)/);
                            if (total) {
                                const n = parseInt(total[1], 10);
                                if (Number.isFinite(n) && n > 0) small += `[${n}集全]`;
                            }
                        }
                    }
                }
            }
        }

        if (!hasEpisode) {
            const er1 = title.match(/E(P)?(\d{1,4})\s*[-~]\s*E(P)?(\d{1,4})/i);
            const er2 = title.match(/EP(\d{1,4})\s*[-~]\s*EP(\d{1,4})/i);
            if (er1) {
                const e1 = parseInt(er1[2], 10);
                const e2 = parseInt(er1[4], 10);
                if (Number.isFinite(e1) && Number.isFinite(e2)) small += ` [第${e1}-${e2}集]`;
            } else if (er2) {
                const e1 = parseInt(er2[1], 10);
                const e2 = parseInt(er2[2], 10);
                if (Number.isFinite(e1) && Number.isFinite(e2)) small += ` [第${e1}-${e2}集]`;
            } else {
                const e = title.match(/E(P)?(\d{1,4})/i);
                if (e) {
                    const ep = parseInt(e[2], 10);
                    if (Number.isFinite(ep)) small += ` [第${ep}集]`;
                }
            }
        }
    }

    return small.trim();
}

function applyHDSkyOptions(labels: Record<string, boolean>, smallDescr: string, description: string, title = '') {
    const setOpt = (value: number | string, on: boolean) => {
        if (!on) return;
        const v = String(value);
        const el = document.querySelector(`input[name="option_sel[]"][value="${v}"]`) as HTMLInputElement | null;
        if (!el) return;
        el.checked = true;
        try {
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('input', { bubbles: true }));
        } catch { }
    };

    // DIY / 原盘
    if (labels.diy) setOpt(13, true);
    else if (labels.yp) setOpt(28, true);

    // Languages / subtitles
    setOpt(5, !!labels.gy);  // 国语
    setOpt(11, !!labels.yy); // 粤语
    setOpt(6, !!labels.zz);  // 中文字幕
    if ((smallDescr || '').match(/特效字幕/)) setOpt(20, true);

    // DV / HDR / HLG
    if (labels.db && (labels.hdr10plus || labels.hdr10)) setOpt(24, true);
    else if (labels.db) setOpt(15, true);
    else if (labels.hdr10plus) setOpt(17, true);
    else if (labels.hdr10) setOpt(9, true);
    if (/\bHLG\b/i.test(`${title} ${description}`)) setOpt(16, true);

    // Atmos / DTS-X
    if (/atmos/i.test(`${title} ${description}`)) setOpt(21, true);
    if (/DTS[- .:]?X(?![26])/i.test(`${title} ${description}`)) setOpt(23, true);
}

function setHDSkyVal(selector: string, val: string): boolean {
    const el = document.querySelector(selector) as HTMLSelectElement | null;
    if (!el || !val) return false;
    if (!Array.from(el.options).some((o) => o.value === val)) return false;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

/**
 * HDSky (`hdsky.me/upload.php`) — live-verified option values (with AV1, 8K, DTS-X, DDP/E-AC3, Opus).
 */
function fillHDSkySelects(meta: TorrentMeta): void {
    try {
        const title = meta.title || '';
        const typeValMap: Record<string, string> = {
            电影: '401',
            纪录: '404',
            动漫: '405',
            剧集: /S\d{1,2}E\d{1,3}/i.test(title) ? '402' : '411',
            综艺: '403',
            MV: '406',
            体育: '407',
            音乐: '408',
            短剧: '416'
        };
        let catVal = typeValMap[meta.type || ''] || '409';
        if (/(?:pad|ipad)$/i.test(title)) catVal = '410';
        setHDSkyVal('#browsecat, select[name="type"]', catVal);

        const audioMap: Record<string, string> = {
            Flac: '1', APE: '2', DTS: '3', MP3: '4', AAC: '6',
            'DTS-HDMA': '10', 'DTS-HD': '10', TrueHD: '11', AC3: '12', LPCM: '13',
            'DTS-HDHR': '14', WAV: '15', 'DTS-HDMA:X 7.1': '16', 'DTS-X': '16',
            Atmos: /DDP|DD\+|E-?AC-?3/i.test(title) ? '21' : '17',
            DSD: '18', OPUS: '22'
        };
        let audioVal = audioMap[meta.audioCodecSel || ''] || '7';
        if (meta.audioCodecSel === 'AC3' && /DDP|DD\+|E-?AC-?3/i.test(title)) audioVal = '20';
        setHDSkyVal('select[name="audiocodec_sel"]', audioVal);

        const stdMap: Record<string, string> = { '8K': '6', '4K': '5', '1080p': '1', '1080i': '2', '720p': '3', SD: '4' };
        if (meta.standardSel && stdMap[meta.standardSel]) {
            setHDSkyVal('select[name="standard_sel"]', stdMap[meta.standardSel]);
        }

        const codecMap: Record<string, string> = {
            H264: /x264/i.test(title) ? '10' : '1',
            X264: '10',
            H265: /x265/i.test(title) ? '13' : '12',
            X265: '13',
            'VC-1': '2',
            'MPEG-2': '4',
            'MPEG-4': '4',
            XVID: '3',
            AV1: '16',
            VP9: '17'
        };
        setHDSkyVal('select[name="codec_sel"]', codecMap[meta.codecSel || ''] || '11');

        const isDiy = /(?:diy|@)/i.test(title);
        const medMap: Record<string, string> = {
            UHD: isDiy ? '14' : '13',
            'Blu-ray': isDiy ? '12' : '1',
            Remux: '3',
            Encode: '7',
            HDTV: '5',
            DVD: '6',
            CD: '8',
            'WEB-DL': '11'
        };
        if (meta.mediumSel && medMap[meta.mediumSel]) {
            setHDSkyVal('select[name="medium_sel"]', medMap[meta.mediumSel]);
        }

        // Team: 27 = Other/其他制作组或转发资源
        setHDSkyVal('select[name="team_sel"]', '27');
    } catch (err) {
        console.error('[Auto-Feed][HDSky] fillHDSkySelects error:', err);
    }
}
