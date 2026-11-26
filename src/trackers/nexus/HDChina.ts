import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';
import { repeat } from '../../common/dom/repeat';

const retry = (fn: () => void, times = 8, delayMs = 220) => repeat(fn, times, delayMs);

function setVal(selector: string, val: string) {
    const el = document.querySelector(selector) as HTMLSelectElement | null;
    if (!el || !val) return;
    if (!Array.from(el.options).some((o) => o.value === val)) return;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

/** HDChina / HDWinG (`hdwing.org/upload.php`) — live-verified form rules including `#share_rule`. */
export class HDChinaEngine extends NexusPHPEngine {
    protected async afterFill(meta: TorrentMeta): Promise<void> {
        retry(() => {
            const title = meta.title || '';
            const small = meta.smallDescr || meta.subtitle || '';
            const std = meta.standardSel || '';
            const med = meta.mediumSel || '';
            const src = meta.sourceSel || '';

            // 1. Category (`#browsecat` / `select[name="type"]`)
            let cat = '409';
            if (/(?:pad|ipad)$/i.test(title)) {
                cat = '27';
            } else {
                switch (meta.type || '电影') {
                    case '电影':
                        if (med === 'UHD' || std === '4K') cat = '410';
                        else if (med === 'Blu-ray') cat = '20';
                        else if (std === '720p') cat = '9';
                        else if (std === '1080i') cat = '16';
                        else cat = '17';
                        break;
                    case '剧集': {
                        const isPack = /(?:complete|S\d{1,2}(?!E))/i.test(title) && !/E\d{1,3}/i.test(title);
                        if (['大陆', '台湾', '香港', '港台'].includes(src)) cat = isPack ? '22' : '25';
                        else if (src === '日本') cat = isPack ? '23' : '24';
                        else if (src === '韩国') cat = isPack ? '23' : '26';
                        else cat = /S\d{1,2}E\d{1,3}/i.test(title) ? '13' : '21';
                        break;
                    }
                    case '音乐':
                        cat = /音乐会|演唱会|concert/i.test(`${small} ${title}`) ? '402' : '408';
                        break;
                    case 'MV': cat = '406'; break;
                    case '综艺': cat = '401'; break;
                    case '动漫': cat = '14'; break;
                    case '纪录': cat = '5'; break;
                    case '体育': cat = '15'; break;
                    case '学习':
                    case '书籍': cat = '404'; break;
                }
            }
            setVal('#browsecat, select[name="type"]', cat);

            // 2. Share rule (`#share_rule`: 3 = 欢迎转载) — mandatory on HDWinG!
            setVal('#share_rule, select[name="share_rule"]', '3');

            // 3. Resolution (`standard_sel`)
            const stdMap: Record<string, string> = { '8K': '19', '4K': '17', '1080p': '11', '1080i': '12', '720p': '13', SD: '15' };
            setVal('select[name="standard_sel"]', stdMap[std] || '10');

            // 4. Medium (`medium_sel`)
            let medVal = '15';
            if (/MiniBD/i.test(title)) medVal = '2';
            else {
                const medMap: Record<string, string> = {
                    UHD: '11', 'Blu-ray': '11', Remux: '6', Encode: '5',
                    'WEB-DL': '21', HDTV: '13', DVD: '14', CD: '1'
                };
                medVal = medMap[med] || '15';
            }
            setVal('select[name="medium_sel"]', medVal);

            // 5. Video codec (`codec_sel`)
            const codecMap: Record<string, string> = {
                H264: '1', X264: '6', H265: '10', X265: '10',
                'VC-1': '2', 'MPEG-2': '4', 'MPEG-4': '4', XVID: '3'
            };
            setVal('select[name="codec_sel"]', codecMap[meta.codecSel || ''] || '5');

            // 6. Audio codec (`audiocodec_sel`) — live hdwing.org IDs (`14` = DTS X, `15` = Atmos)
            const audioMap: Record<string, string> = {
                Atmos: '15', 'DTS-X': '14', 'DTS-HDMA:X 7.1': '14',
                TrueHD: '13', 'DTS-HDMA': '12', LPCM: '11',
                DTS: '3', 'DTS-HD': '3', 'DTS-HDHR': '3',
                AC3: '8', AAC: '6', Flac: '1', APE: '2', WAV: '9', MP3: '4'
            };
            setVal('select[name="audiocodec_sel"]', audioMap[meta.audioCodecSel || ''] || '7');

            // 7. Team (`team_sel`: 5 = 其他(Other))
            setVal('select[name="team_sel"]', '5');
        });
    }
}
