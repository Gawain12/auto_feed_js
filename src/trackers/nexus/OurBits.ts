import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { repeat } from '../../common/dom/repeat';
import { getMetaLabels } from '../../common/rules/labels';
import { getSourceSelFromDescr } from '../../common/rules/helpers';

const retry = (fn: () => void, times = 8, delayMs = 220) => repeat(fn, times, delayMs);

function setVal(selector: string, val: string) {
    const el = document.querySelector(selector) as HTMLSelectElement | null;
    if (!el || !val) return;
    if (!Array.from(el.options).some((o) => o.value === val)) return;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

const setById = (id: string, on: boolean) => {
    if (!on) return;
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el || el.type !== 'checkbox') return;
    if (!el.checked) {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

/** OurBits (`ourbits.club/upload.php`) — live-verified selects, region `processing_sel`, and tags. */
export class OurBitsEngine extends NexusPHPEngine {
    protected async afterFill(meta: TorrentMeta): Promise<void> {
        retry(() => {
            const title = meta.title || '';
            const std = meta.standardSel || '';
            const med = meta.mediumSel || '';

            // 1. Category (`#browsecat`)
            let cat = '401';
            switch (meta.type || '电影') {
                case '电影': cat = /(?:^|[.\s])3D(?:[.\s]|$)/i.test(title) ? '402' : '401'; break;
                case '剧集': cat = /S\d{1,2}E\d{1,3}/i.test(title) ? '412' : '405'; break;
                case '综艺': cat = '413'; break;
                case '纪录': cat = '410'; break;
                case '动漫': cat = '411'; break;
                case '体育': cat = '415'; break;
                case 'MV': cat = '414'; break;
                case '音乐': cat = /演唱会|concert/i.test(`${meta.smallDescr || ''} ${title}`) ? '419' : '416'; break;
            }
            setVal('#browsecat, select[name="type"]', cat);

            // 2. Medium (`medium_sel`)
            const medMap: Record<string, string> = {
                UHD: '12', 'Blu-ray': '1', Remux: std === '4K' ? '12' : '1',
                Encode: '7', 'WEB-DL': '9', HDTV: std === '4K' ? '13' : '5', DVD: '2', CD: '8'
            };
            setVal('select[name="medium_sel"]', medMap[med] || '7');

            // 3. Video codec (`codec_sel`)
            const codecMap: Record<string, string> = {
                H264: '12', X264: '12', H265: '14', X265: '14',
                'MPEG-2': '15', 'MPEG-4': '15', 'VC-1': '16', XVID: '17', AV1: '19'
            };
            setVal('select[name="codec_sel"]', codecMap[meta.codecSel || ''] || '18');

            // 4. Audio codec (`audiocodec_sel`)
            const audioMap: Record<string, string> = {
                Atmos: '14', 'DTS-X': '21', 'DTS-HDMA:X 7.1': '21',
                'DTS-HDMA': '1', 'DTS-HD': '1', 'DTS-HDHR': '1',
                TrueHD: '2', DTS: '4', LPCM: '5', Flac: '13', APE: '12',
                AAC: '7', AC3: '6', WAV: '11', MP3: '32', OPUS: '33'
            };
            setVal('select[name="audiocodec_sel"]', audioMap[meta.audioCodecSel || ''] || '6');

            // 5. Resolution (`standard_sel`)
            const stdMap: Record<string, string> = { '4K': '5', '1080p': '1', '1080i': '2', '720p': '3', SD: '4' };
            setVal('select[name="standard_sel"]', stdMap[std] || '1');

            // 6. Region (`processing_sel`: 1 CN, 2 US/EU, 3 HK/TW, 4 JP, 5 KR, 6 OT)
            const region = (meta.sourceSel || getSourceSelFromDescr(meta.description || '') || '').trim();
            const regionMap: Record<string, string> = {
                大陆: '1', 欧美: '2', 香港: '3', 台湾: '3', 港台: '3', 日本: '4', 韩国: '5'
            };
            setVal('select[name="processing_sel"]', regionMap[region] || '6');

            // 7. Tags
            try {
                const labels = getMetaLabels(meta);
                setById('tag_gy', !!labels.gy);
                setById('tag_zz', !!labels.zz);
                setById('tag_diy', !!labels.diy);
                setById('tag_hdr', !!labels.hdr10);
                setById('tag_hdrp', !!labels.hdr10plus);
                setById('tag_db', !!labels.db);
                setById('tag_hlg', /HLG/i.test(title));
                setById('tag_hdrvivid', /HDR\s*Vivid/i.test(`${title} ${meta.description || ''}`));
            } catch {}
        });
    }
}
