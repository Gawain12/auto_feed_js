import $ from 'jquery';
import { NexusPHPEngine } from './NexusPHP';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { getLabel } from '../common/rules/text';
import { hasIdQuery, isPage } from '../common/rules/pages';

export class CHDBitsEngine extends NexusPHPEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php') && hasIdQuery(url);
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling CHDBits form...');
        await super.fill(meta);
        this.lockNameField(meta.title || '');

        const labels = meta.labelInfo || getLabel(`${meta.smallDescr || meta.subtitle || ''}${meta.title}#separator#${meta.description}`);
        meta.labelInfo = labels;

        try {
            if (labels.gy) (document.getElementsByName('cnlang')[0] as HTMLInputElement).checked = true;
            if (labels.zz) (document.getElementsByName('cnsub')[0] as HTMLInputElement).checked = true;
            if (labels.diy) (document.getElementsByName('diy')[0] as HTMLInputElement).checked = true;
            if (/特效字幕/.test(`${meta.smallDescr || meta.subtitle || ''} ${meta.description || ''}`)) {
                const tx = document.getElementsByName('txsub')[0] as HTMLInputElement | undefined;
                if (tx) tx.checked = true;
            }
        } catch {}
        try {
            // CHD variants differ by skin; match by id/name/value/label text.
            this.checkByAlias(!!labels.hdr10, ['hdr10', 'hdr'], /(HDR10)/i);
            this.checkByAlias(!!labels.hdr10plus, ['hdr10plus', 'hdrm', 'hdr10+'], /(HDR10\+|HDR\+)/i);
            this.checkByAlias(!!labels.db, ['dovi', 'dolbyvision', 'db', 'dv'], /(Dolby.?Vision|杜比视界|DoVi|\bDV\b)/i);
        } catch {}

        const setSelectVal = (name: string, val: string) => {
            const el = document.getElementsByName(name)[0] as HTMLSelectElement | undefined;
            if (!el || !val) return;
            if (!Array.from(el.options).some((o) => o.value === val)) return;
            el.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        // Live-verified chdbits.co/upload.php values
        try {
            const typeDict: Record<string, string> = {
                电影: '401',
                剧集: '402',
                动漫: '405',
                综艺: '403',
                音乐: '406',
                MV: '406',
                纪录: '404',
                体育: '407',
                游戏: '410'
            };
            if (meta.type === '书籍' && /m4a|mp3/i.test(meta.description || '')) {
                setSelectVal('type', '408');
            } else if (meta.type && typeDict[meta.type]) {
                setSelectVal('type', typeDict[meta.type]);
            }

            const audioDict: Record<string, string> = {
                Flac: '1', APE: '2', DTS: '3', AAC: '6', AC3: '7',
                'DTS-HDMA': '10', 'DTS-HD': '10', 'DTS-HDHR': '10', 'DTS-HDMA:X 7.1': '10', 'DTS-X': '10',
                TrueHD: '11', Atmos: '11', 'TrueHD Atmos': '11',
                WAV: '12', LPCM: '13', ALAC: '14'
            };
            if (meta.audioCodecSel && audioDict[meta.audioCodecSel]) {
                setSelectVal('audiocodec_sel', audioDict[meta.audioCodecSel]);
            }

            const stdDict: Record<string, string> = {
                '8K': '7', '4K': '6', '1080p': '1', '1080i': '2', '720p': '3', SD: '5', '': '5'
            };
            setSelectVal('standard_sel', stdDict[meta.standardSel || ''] || '5');

            const codecDict: Record<string, string> = {
                H264: '1', X264: '1', H265: '5', X265: '5',
                'VC-1': '2', AV1: '3', 'MPEG-2': '4', 'MPEG-4': '6'
            };
            if (meta.codecSel && codecDict[meta.codecSel]) {
                setSelectVal('codec_sel', codecDict[meta.codecSel]);
            }

            const medDict: Record<string, string> = {
                'Blu-ray': '1', UHD: '19', Remux: '3', Encode: '4', HDTV: '6', 'WEB-DL': '18', CD: '8'
            };
            if (meta.mediumSel && medDict[meta.mediumSel]) {
                setSelectVal('medium_sel', medDict[meta.mediumSel]);
            }

            // Processing (`processing_sel`: 1=3D, 3=美剧, 4=日剧, 5=港剧, 6=韩剧, 7=英剧, 8=国剧, 9=台剧, 13=合集)
            const t = meta.title || '';
            if (/(?:^|[.\s])3D(?:[.\s]|$)/i.test(t)) {
                setSelectVal('processing_sel', '1');
            } else if (meta.type === '剧集') {
                const isPack = /(?:complete|S\d{1,2}(?!E))/i.test(t) && !/E\d{1,3}/i.test(t);
                const src = meta.sourceSel || '';
                if (isPack) setSelectVal('processing_sel', '13');
                else if (src === '日本') setSelectVal('processing_sel', '4');
                else if (src === '香港') setSelectVal('processing_sel', '5');
                else if (src === '韩国') setSelectVal('processing_sel', '6');
                else if (src === '大陆') setSelectVal('processing_sel', '8');
                else if (src === '台湾') setSelectVal('processing_sel', '9');
                else if (src === '欧美') setSelectVal('processing_sel', /英国/.test(meta.description || '') ? '7' : '3');
            }
        } catch (err) {
            console.error(err);
        }

        try {
            $('select[name="source_sel"]').val(7);
            this.checkTeam(meta, 'team_sel');
        } catch {}

        // Torrent input name differs on CHDBits
        try {
            const { TorrentService } = await import('../services/TorrentService');
            const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, null);
            if (result) {
                TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
                this.lockNameField(meta.title || '');
            }
        } catch (err) {
            console.error('[Auto-Feed][CHDBits] Torrent inject failed:', err);
        }
    }

    private lockNameField(target: string) {
        const expect = String(target || '').trim();
        if (!expect) return;
        const apply = () => {
            const inputs = Array.from(
                document.querySelectorAll('input[name="name"], input#name, #name')
            ) as HTMLInputElement[];
            inputs.forEach((input) => {
                if (!input) return;
                if ((input.value || '').trim() === expect) return;
                input.value = expect;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
        };
        [0, 120, 360, 800, 1500, 2600, 4200, 6500, 9000, 12000].forEach((ms) => {
            window.setTimeout(apply, ms);
        });
    }

    private checkByAlias(on: boolean, aliases: string[], labelPattern: RegExp) {
        if (!on) return;
        const aliasSet = new Set(aliases.map((x) => String(x).toLowerCase()));
        const inputs = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
        const getText = (el: HTMLInputElement) => {
            if (el.id) {
                const byFor = document.querySelector(`label[for="${el.id}"]`) as HTMLLabelElement | null;
                if (byFor?.textContent) return byFor.textContent.trim();
            }
            return ((el.closest('label') as HTMLLabelElement | null)?.textContent || el.parentElement?.textContent || '').trim();
        };
        inputs.forEach((el) => {
            const name = (el.name || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            const val = (el.value || '').toLowerCase();
            const txt = getText(el);
            const hit = aliasSet.has(name) || aliasSet.has(id) || aliasSet.has(val) || labelPattern.test(txt);
            if (!hit) return;
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    private checkTeam(meta: TorrentMeta, selectName: string) {
        if (!meta.title) return;
        const nameTail = meta.title.split(/(19|20)\d{2}/).pop() || '';
        $(`select[name="${selectName}"]>option`).each((index, el) => {
            const text = (el as HTMLOptionElement).innerText || '';
            if (nameTail.toLowerCase().match(text.toLowerCase())) {
                if (
                    (nameTail.match(/PSY|LCHD/) && text === 'CHD') ||
                    (nameTail.match(/PandaMoon/) && text === 'Panda') ||
                    text === 'DIY' ||
                    text === 'REMUX'
                ) {
                    return;
                } else if (nameTail.match(/HDSpace/i) && text.match(/HDS/i)) {
                    return;
                } else if (nameTail.match(/HDClub/i) && text.match(/HDC/i)) {
                    return;
                } else if (nameTail.match(/REPACK/i) && text.match(/PACK/i)) {
                    return;
                } else {
                    $(`select[name^="${selectName}"]>option:eq(${index})`).prop('selected', true);
                }
            }
        });
    }
}
