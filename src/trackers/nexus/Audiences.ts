import $ from 'jquery';
import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { getType } from '../../common/rules/text';
import { htmlToBBCode } from '../../utils/htmlToBBCode';
import { repeat } from '../../common/dom/repeat';
import { getMetaLabels } from '../../common/rules/labels';

const retry = (fn: () => void, times = 6, delayMs = 250) => repeat(fn, times, delayMs);

/**
 * Audiences redesigned its upload dropdowns into `.ui-dropdown` widgets backed by
 * `<input type="hidden" name="..." class="ui-dropdown-value">` + `<ul class="ui-dropdown-list">`.
 * Drive both the custom `.ui-dropdown` and native `<select>` (for older skins / fallback).
 */
export function setAudiencesDropdown(fieldName: string, value: string): boolean {
    if (!value) return false;
    const hidden = document.querySelector(`.ui-dropdown input[name="${fieldName}"], input.ui-dropdown-value[name="${fieldName}"]`) as HTMLInputElement | null;
    if (hidden) {
        const container = hidden.closest('.ui-dropdown');
        const link = container?.querySelector(`.ui-dropdown-list a[data-value="${value}"]`) as HTMLElement | null;
        if (link && container) {
            if (hidden.value !== value) {
                link.click();
            }
            if (hidden.value !== value) {
                hidden.value = value;
                const triggerText = container.querySelector('.ui-dropdown-trigger__text');
                if (triggerText) triggerText.textContent = (link.textContent || '').trim();
                container.querySelectorAll('.ui-dropdown-list li').forEach((li) => li.classList.remove('is-selected'));
                link.closest('li')?.classList.add('is-selected');
                hidden.dispatchEvent(new Event('input', { bubbles: true }));
                hidden.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return true;
        }
    }

    const select = (
        document.querySelector(`select[name="${fieldName}"]`) ||
        (fieldName === 'type' ? document.querySelector('#browsecat, select[name="browsecat"]') : null)
    ) as HTMLSelectElement | null;
    if (select) {
        const exists = Array.from(select.options).some((o) => o.value === value);
        if (exists) {
            select.value = value;
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    }
    return false;
}

export class AudiencesEngine extends NexusPHPEngine {
    protected async afterParse(meta: TorrentMeta): Promise<TorrentMeta> {
        const out: TorrentMeta = { ...meta };

        try {
            if (document.querySelector('span.tags.tdh')) out.type = '动漫';
            const tagRow = $('td.rowhead:contains("标签") + td, td.rowhead:contains("標籤") + td').first().text();
            if (/动画|動漫/.test(tagRow)) out.type = '动漫';
        } catch {}

        // Strip trailing rating badges (e.g. `5.5/10`) rendered inside Audiences' subtitle cell.
        if (out.subtitle) {
            out.subtitle = out.subtitle.replace(/\s*\d+(?:\.\d+)?\/10.*$/g, '').trim();
        }
        if (out.smallDescr) {
            out.smallDescr = out.smallDescr.replace(/\s*\d+(?:\.\d+)?\/10.*$/g, '').trim();
        }

        try {
            const typeText = $('td.rowhead:contains("类型") + td, td.rowhead:contains("類別") + td, td.rowhead:contains("Category") + td, td.rowhead:contains("Type") + td')
                .first()
                .text()
                .trim();
            if (typeText && !out.type) out.type = getType(typeText) || typeText;
        } catch {}

        try {
            if (!out.fullMediaInfo) {
                const codemains = Array.from(document.querySelectorAll('.codemain')) as HTMLElement[];
                if (codemains.length) {
                    let node = codemains[codemains.length - 1];
                    const font = node.querySelector('font') as HTMLElement | null;
                    if (font) node = font;
                    const mi = htmlToBBCode(node)
                        .replace(/\[\/?(font|size|color)[^\]]*\]/gi, '')
                        .replace(/\r/g, '')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();
                    if (mi && /General|Video|Audio|DISC INFO|MPLS|Unique ID|Bit rate|Frame rate/i.test(mi)) {
                        out.fullMediaInfo = mi;
                    }
                }
            }
        } catch {}

        return out;
    }

    protected async afterFill(meta: TorrentMeta): Promise<void> {
        retry(() => {
            const title = meta.title || '';
            const descr = meta.description || '';

            if (meta.type === '书籍') {
                const m = descr.match(/m4a|mp3/i)?.[0];
                if (m) meta.audioCodecSel = m.toUpperCase();
            }

            // 1. Category (`type`)
            const typeDict: Record<string, string> = {
                电影: '401',
                剧集: '402',
                综艺: '403',
                纪录: '406',
                音乐: '408',
                体育: '407',
                软件: '409',
                学习: '412',
                游戏: '410',
                书籍: '405',
                MV: '408'
            };
            let typeVal = typeDict[meta.type || ''] ?? '409';
            if (meta.type === '动漫') {
                typeVal = /S\d+|E\d+/i.test(title) || /◎集.*?数.*?\d+/.test(descr) ? '402' : '401';
                const dh = document.querySelector('input[name="tags[]"][value="dh"]') as HTMLInputElement | null;
                if (dh && !dh.checked) {
                    dh.checked = true;
                    dh.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            if (meta.type === '书籍' && /m4a|mp3/i.test(descr)) {
                typeVal = '404';
            }
            setAudiencesDropdown('type', typeVal);

            // 2. Medium (`medium_sel`)
            let mv = '11';
            switch (meta.mediumSel) {
                case 'UHD': mv = /DIY|@/i.test(title) ? '13' : '12'; break;
                case 'Blu-ray': mv = /DIY|@/i.test(title) ? '14' : '1'; break;
                case 'DVD': mv = '2'; break;
                case 'Remux': mv = '3'; break;
                case 'HDTV': mv = '5'; break;
                case 'Encode': mv = '15'; break;
                case 'WEB-DL': mv = '10'; break;
                case 'CD': mv = '8'; break;
            }
            setAudiencesDropdown('medium_sel', mv);

            // 3. Video codec (`codec_sel`)
            let cv = '5';
            switch (meta.codecSel) {
                case 'H265': case 'X265': cv = '6'; break;
                case 'H264': case 'X264': cv = '1'; break;
                case 'VC-1': cv = '2'; break;
                case 'MPEG-2': case 'MPEG-4': cv = '4'; break;
                case 'AV1': cv = '7'; break;
            }
            setAudiencesDropdown('codec_sel', cv);

            // 4. Audio codec (`audiocodec_sel`)
            let av = '7';
            switch (meta.audioCodecSel) {
                case 'DTS-HDMA:X 7.1': case 'DTS-X': av = '25'; break;
                case 'Atmos': av = '26'; break;
                case 'DTS-HD': case 'DTS-HDMA': case 'DTS-HDHR': av = '19'; break;
                case 'TrueHD': av = '20'; break;
                case 'LPCM': av = '21'; break;
                case 'DTS': av = '3'; break;
                case 'AC3': av = '18'; break;
                case 'OPUS': av = '27'; break;
                case 'AAC': av = '6'; break;
                case 'Flac': av = '1'; break;
                case 'APE': av = '2'; break;
                case 'WAV': av = '22'; break;
                case 'MP3': av = '23'; break;
                case 'M4A': av = '24'; break;
            }
            setAudiencesDropdown('audiocodec_sel', av);

            // 5. Resolution (`standard_sel`) — exact live data-value mapping
            const stdDict: Record<string, string> = {
                '8K': '10',
                '4K': '5',
                '1080p': '1',
                '1080i': '2',
                '720p': '3',
                SD: '4',
                '': '11'
            };
            setAudiencesDropdown('standard_sel', stdDict[meta.standardSel || ''] ?? '11');

            // 6. Tags
            try {
                const labels = getMetaLabels(meta);
                const check = (value: string, on: boolean) => {
                    if (!on) return;
                    const el = document.querySelector(`input[name="tags[]"][value="${value}"]`) as HTMLInputElement | null;
                    if (el && !el.checked) {
                        el.checked = true;
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                };
                check('gy', !!labels.gy);
                check('yy', !!labels.yy);
                check('zz', !!labels.zz);
                check('diy', !!labels.diy);
                check('hdr10', !!labels.hdr10);
                check('hdrm', !!labels.hdr10plus);
                check('db', !!labels.db);
                check('wj', !!labels.complete);
            } catch {}
        }, 10, 200);
    }
}
