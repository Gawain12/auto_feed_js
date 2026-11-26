import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { repeat } from '../../common/dom/repeat';
import { getMetaLabels } from '../../common/rules/labels';

const retry = (fn: () => void, times = 8, delayMs = 220) => repeat(fn, times, delayMs);

function setVal(selector: string, val: string) {
    const el = document.querySelector(selector) as HTMLSelectElement | null;
    if (!el || !val) return;
    if (!Array.from(el.options).some((o) => o.value === val)) return;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

/** HDHome (`hdhome.org/upload.php`) — live-verified composite category & dropdown rules. */
export class HDHomeEngine extends NexusPHPEngine {
    protected async afterFill(meta: TorrentMeta): Promise<void> {
        retry(() => {
            const title = meta.title || '';
            const descr = meta.description || '';
            const std = meta.standardSel || '';
            const med = meta.mediumSel || '';
            const isPad = /(?:pad|ipad)$/i.test(title);
            const isUhd = med === 'UHD' || std === '4K' || /UHD|2160p/i.test(title);

            // 1. Composite Category (`#browsecat`)
            let cat = '409';
            switch (meta.type || '电影') {
                case '电影':
                    if (med === 'UHD') cat = std === '8K' ? '506' : '499';
                    else if (med === 'Blu-ray') cat = '450';
                    else if (med === 'Remux') cat = isUhd ? '518' : '415';
                    else if (isPad) cat = '412';
                    else if (std === '8K') cat = '505';
                    else if (std === '4K') cat = '416';
                    else if (std === '720p') cat = '413';
                    else if (std === 'SD') cat = '411';
                    else cat = '414';
                    break;
                case '剧集':
                    if (med === 'UHD' || (med === 'Blu-ray' && std === '4K')) cat = std === '8K' ? '523' : '502';
                    else if (med === 'Blu-ray') cat = '453';
                    else if (med === 'Remux') cat = '437';
                    else if (isPad) cat = '433';
                    else if (std === '8K') cat = '526';
                    else if (std === '4K') cat = '438';
                    else if (std === '1080i') cat = '435';
                    else if (std === '720p') cat = '434';
                    else if (std === 'SD') cat = '432';
                    else cat = '436';
                    break;
                case '纪录':
                    if (med === 'UHD') cat = std === '8K' ? '508' : '500';
                    else if (med === 'Blu-ray') cat = '451';
                    else if (med === 'Remux') cat = std === '8K' ? '529' : '421';
                    else if (isPad) cat = '418';
                    else if (std === '8K') cat = '507';
                    else if (std === '4K') cat = '422';
                    else if (std === '720p') cat = '419';
                    else if (std === 'SD') cat = '417';
                    else cat = '420';
                    break;
                case '动漫':
                    if (med === 'UHD') cat = std === '8K' ? '510' : '501';
                    else if (med === 'Blu-ray') cat = '454';
                    else if (med === 'Remux') cat = isUhd ? '531' : '448';
                    else if (isPad) cat = '445';
                    else if (std === '8K') cat = '509';
                    else if (std === '4K') cat = '449';
                    else if (std === '720p') cat = '446';
                    else if (std === 'SD') cat = '444';
                    else cat = '447';
                    break;
                case '综艺':
                    if (med === 'Blu-ray' || med === 'UHD') cat = '452';
                    else if (med === 'Remux') cat = '430';
                    else if (isPad) cat = '426';
                    else if (std === '4K') cat = '431';
                    else if (std === '1080i') cat = '428';
                    else if (std === '720p') cat = '427';
                    else if (std === 'SD') cat = '425';
                    else cat = '429';
                    break;
                case '体育':
                    if (std === '8K') cat = '511';
                    else if (std === '4K') cat = '504';
                    else if (std === '720p') cat = '442';
                    else cat = '443';
                    break;
                case '音乐':
                    if (/mpls/i.test(descr)) cat = '503';
                    else if (/APE/i.test(title)) cat = '439';
                    else cat = '440';
                    break;
                case 'MV': cat = '441'; break;
            }
            setVal('#browsecat', cat);

            // 2. Source (`source_sel`)
            const sourceMap: Record<string, string> = {
                UHD: '9', 'Blu-ray': '1', Remux: isUhd ? '9' : '1', Encode: isUhd ? '9' : '1',
                HDTV: '4', DVD: '3', 'WEB-DL': '7'
            };
            setVal('select[name="source_sel"]', sourceMap[med] || '8');

            // 3. Medium (`medium_sel`)
            const medMap: Record<string, string> = {
                UHD: '10', 'Blu-ray': '1', Remux: '3', Encode: '7',
                HDTV: '5', CD: '8', 'WEB-DL': '11'
            };
            setVal('select[name="medium_sel"]', /MiniBD/i.test(title) ? '4' : (medMap[med] || '7'));

            // 4. Codec (`codec_sel`)
            const codecMap: Record<string, string> = {
                H264: '1', X264: '1', H265: '2', X265: '2', 'VC-1': '3', 'MPEG-2': '4', 'MPEG-4': '4'
            };
            setVal('select[name="codec_sel"]', codecMap[meta.codecSel || ''] || '5');

            // 5. Audio (`audiocodec_sel`)
            const audioMap: Record<string, string> = {
                'DTS-HDMA:X 7.1': '17', 'DTS-X': '17', Atmos: '12',
                'DTS-HDMA': '11', 'DTS-HD': '11', 'DTS-HDHR': '18',
                TrueHD: '13', LPCM: '14', DTS: '3', AC3: '15', AAC: '6',
                Flac: '1', APE: '2', WAV: '16'
            };
            setVal('select[name="audiocodec_sel"]', audioMap[meta.audioCodecSel || ''] || '7');

            // 6. Standard (`standard_sel`)
            const stdMap: Record<string, string> = { '8K': '10', '4K': '1', '1080p': '2', '1080i': '3', '720p': '4', SD: '5' };
            setVal('select[name="standard_sel"]', stdMap[std] || '2');

            // 7. Processing (`processing_sel`: 1 Raw / 2 Encode) & Team (`team_sel`: 11 Other)
            setVal('select[name="processing_sel"]', ['UHD', 'Blu-ray', 'Remux', 'DVD'].includes(med) ? '1' : '2');
            setVal('select[name="team_sel"]', '11');

            // 8. Tags (untouched `ybyp` + effects subtitles `tx`)
            try {
                const labels = getMetaLabels(meta);
                const checkTag = (selector: string, on: boolean) => {
                    if (!on) return;
                    const el = document.querySelector(selector) as HTMLInputElement | null;
                    if (el && !el.checked) {
                        el.checked = true;
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                };
                checkTag('#tag_ybyp, input[name="tags[]"][value="ybyp"]', !labels.diy && !!labels.yp);
                checkTag('input[name="tags[]"][value="tx"]', /特效字幕/.test(`${meta.smallDescr || meta.subtitle || ''} ${descr}`));
            } catch {}
        });
    }
}
