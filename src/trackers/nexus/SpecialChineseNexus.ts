import $ from 'jquery';
import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { dispatchFormEvents, setAllFormValues, setFirstFormValue } from '../../common/dom/form';
import { getMediainfoPictureFromDescr } from '../../common/rules/media';
import { getSearchName } from '../../common/rules/search';

/**
 * NPUPT (npupt.com) — Edu NexusPHP with split structured title fields (`#torrent_name_field0..5`)
 * and type-dependent `#source_sel`.
 */
export class NPUPTEngine extends NexusPHPEngine {
    protected async afterFill(meta: TorrentMeta): Promise<void> {
        const typeDict: Record<string, string> = {
            电影: '401',
            剧集: '402',
            纪录: '404',
            动漫: '405',
            综艺: '403',
            学习: '411',
            音乐: '414',
            体育: '407',
            软件: '408'
        };
        const browsecat = document.getElementById('browsecat') as HTMLSelectElement | null;
        if (browsecat) {
            browsecat.value = typeDict[meta.type || ''] || '409';
            dispatchFormEvents(browsecat);
        }

        const cb = document.getElementById('torrent_name_checkbox') as HTMLInputElement | null;
        if (cb && !cb.checked) {
            cb.checked = true;
            dispatchFormEvents(cb);
        }

        const title = meta.targetTitle || meta.title || '';
        const src = meta.sourceSel || '';
        const sourceSelEl = document.getElementById('source_sel') as HTMLSelectElement | null;

        if (meta.type === '电影') {
            if (sourceSelEl) {
                if (['大陆', '台湾', '香港', '港台'].includes(src)) sourceSelEl.value = '6';
                else if (src === '欧美') sourceSelEl.value = '5';
                else if (['日本', '韩国', '日韩'].includes(src)) sourceSelEl.value = '4';
                else sourceSelEl.value = '7';
                dispatchFormEvents(sourceSelEl);
            }
            setFirstFormValue('#torrent_name_field0', getSearchName(title));
            const year = title.match(/(19|20)\d{2}/)?.[0] || '';
            if (year) setFirstFormValue('#torrent_name_field1', year);
        } else if (meta.type === '剧集') {
            if (sourceSelEl) {
                if (src === '大陆') sourceSelEl.value = '23';
                else if (['台湾', '香港', '港台'].includes(src)) sourceSelEl.value = '24';
                else if (src === '欧美') sourceSelEl.value = '25';
                else if (src === '日本') sourceSelEl.value = '26';
                else if (src === '韩国') sourceSelEl.value = '27';
                else sourceSelEl.value = '63';
                dispatchFormEvents(sourceSelEl);
            }
            setFirstFormValue('#torrent_name_field0', getSearchName(title));
            const se = title.match(/S\d+(?:-S\d+)?|S\d+(?:E\d+)?|EP?\d+(?:-E?\d+)?/i)?.[0] || '';
            if (se) setFirstFormValue('#torrent_name_field1', se);
        }

        const medMap: Record<string, string> = {
            UHD: 'BluRay',
            'Blu-ray': 'BluRay',
            DVD: 'DVD',
            Remux: 'Remux',
            HDTV: 'HDTV',
            'WEB-DL': 'WEB-DL',
            Encode: 'Encode'
        };
        if (meta.mediumSel && medMap[meta.mediumSel]) {
            setFirstFormValue('#torrent_name_field2', medMap[meta.mediumSel]);
        }

        const stdMap: Record<string, string> = {
            '4K': '2160p',
            '1080p': '1080p',
            '1080i': '1080i',
            '720p': '720p',
            SD: '480p'
        };
        if (meta.standardSel && stdMap[meta.standardSel]) {
            setFirstFormValue('#torrent_name_field3', stdMap[meta.standardSel]);
        }

        const codecMap: Record<string, string> = {
            H264: 'H264',
            X264: 'x264',
            H265: 'x265',
            X265: 'x265',
            'VC-1': 'WMV',
            'MPEG-2': 'MPEG2',
            XVID: 'Xvid'
        };
        if (meta.codecSel && codecMap[meta.codecSel]) {
            setFirstFormValue('#torrent_name_field4', codecMap[meta.codecSel]);
        }

        const teamMatch = title.trim().match(/(wiki|cmct|mteam|epic|HDChina|hds|beast|ctrlhd|chd)/i);
        if (teamMatch?.[1]) {
            setFirstFormValue('#torrent_name_field5', teamMatch[1]);
        }
    }
}

/**
 * HaiDan (haidan.video) — NexusPHP fork with `#season`, `#episode`, `#team_suffix`,
 * `textarea[name="nfo-string"]`, and `textarea[name="preview-pics"]`.
 */
export class HaiDanEngine extends NexusPHPEngine {
    protected async afterFill(meta: TorrentMeta): Promise<void> {
        const setIdx = (name: string, idx: number) => {
            const sel = document.getElementsByName(name)[0] as HTMLSelectElement | undefined;
            if (!sel || !sel.options[idx]) return;
            sel.selectedIndex = idx;
            sel.options[idx].selected = true;
            dispatchFormEvents(sel);
        };

        const typeIdx: Record<string, number> = {
            电影: 2,
            剧集: 4,
            动漫: 3,
            综艺: 5,
            音乐: 9,
            纪录: 1,
            体育: 7,
            MV: 6
        };
        setIdx('type', typeIdx[meta.type || ''] ?? 8);

        const title = meta.targetTitle || meta.title || '';
        const small = meta.smallDescr || meta.subtitle || '';
        if (meta.type === '剧集') {
            const se = title.match(/S(\d+)E(\d+)/i);
            const sOnly = title.match(/S(\d+)/i);
            const epOnly = title.match(/E\d+(?:-E\d+)?/);
            if (se) {
                setAllFormValues('#season', se[1]);
                setAllFormValues('#episode', se[2]);
            } else if (sOnly) {
                setAllFormValues('#season', sOnly[1]);
            } else if (/COMPLETE/i.test(title) || /全\d+集/.test(small)) {
                setAllFormValues('#season', '1');
            } else if (epOnly) {
                setAllFormValues('#season', '1');
                setAllFormValues('#episode', epOnly[0].replace(/E/g, ''));
            }
        }

        const medIdx: Record<string, number> = {
            UHD: 1,
            'Blu-ray': 2,
            Remux: 3,
            Encode: 4,
            HDTV: 5,
            'WEB-DL': 6,
            DVD: 7,
            CD: 8
        };
        if (meta.mediumSel && medIdx[meta.mediumSel] !== undefined) {
            setIdx('medium_sel', medIdx[meta.mediumSel]);
        }

        const codecIdx: Record<string, number> = {
            H264: 1,
            X264: 1,
            'VC-1': 2,
            'MPEG-2': 3,
            H265: 5,
            X265: 5,
            XVID: 6
        };
        setIdx('codec_sel', codecIdx[meta.codecSel || ''] ?? 4);

        const audioIdx: Record<string, number> = {
            Flac: 1,
            APE: 2,
            DTS: 3,
            AAC: 5,
            'DTS-HD': 6,
            AC3: 7,
            LPCM: 8,
            'DTS-HDMA': 9,
            'DTS-HDMA:X 7.1': 9,
            'DTS-HDHR': 9,
            TrueHD: 10,
            Atmos: 10,
            MP3: 10,
            '': 6
        };
        if (audioIdx[meta.audioCodecSel || ''] !== undefined) {
            setIdx('audiocodec_sel', audioIdx[meta.audioCodecSel || '']);
        }

        const stdIdx: Record<string, number> = {
            '4K': 1,
            '1080p': 2,
            '1080i': 3,
            '720p': 4,
            SD: 5,
            '': 5
        };
        setIdx('standard_sel', stdIdx[meta.standardSel || ''] ?? 5);

        const teamMatch = title.match(/-([^-]*?)$/);
        if (teamMatch?.[1]) {
            setAllFormValues('#team_suffix', teamMatch[1].trim());
        }

        try {
            const info = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
            const mi = (meta.fullMediaInfo || info.mediainfo || '').trim();
            if (mi) setAllFormValues('textarea[name="nfo-string"]', mi);
            if (info.picInfo) {
                const urls = Array.from(info.picInfo.matchAll(/\[img\](.*?)\[\/img\]/gi))
                    .map((m) => m[1].trim())
                    .filter(Boolean);
                const picVal = urls.length ? Array.from(new Set(urls)).join('\n') : info.picInfo;
                setAllFormValues('textarea[name="preview-pics"]', picVal);
            }
            // Match legacy styling on HaiDan textareas if present
            const boxes = $('textarea[name="descr"], textarea[name="nfo-string"], textarea[name="preview-pics"]');
            if (boxes.length) boxes.css({ minHeight: '160px' });
        } catch {}
    }
}
