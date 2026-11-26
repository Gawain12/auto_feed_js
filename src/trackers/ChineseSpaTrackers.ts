import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { NexusPHPEngine } from './NexusPHP';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { extractDoubanId, extractImdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel, getType } from '../common/rules/text';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { dispatchFormEvents, setAllFormValues, setFirstFormValue } from '../common/dom/form';
import { SettingsService } from '../services/SettingsService';
import { GMAdapter } from '../services/GMAdapter';

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function bbcodeToMarkdown(text: string): string {
    return String(text || '')
        .replace(/\[size=\d+\]|\[\/size\]/gi, '')
        .replace(/\[font=[^\]]+\]|\[\/font\]/gi, '')
        .replace(/\[color=[^\]]+\]|\[\/color\]/gi, '')
        .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '![]($1)')
        .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '[$2]($1)')
        .replace(/\[url\]([\s\S]*?)\[\/url\]/gi, '<$1>')
        .replace(/\[b\]\s*/gi, '**')
        .replace(/\s*\[\/b\]/gi, '**')
        .replace(/\[i\]\s*/gi, '*')
        .replace(/\s*\[\/i\]/gi, '*')
        .replace(/\[quote(?:=[^\]]+)?\]([\s\S]*?)\[\/quote\]/gi, (_, body) =>
            '\n' + String(body || '').trim().split(/\r?\n/).map((line) => `> ${line}`).join('\n') + '\n'
        )
        .trim();
}

function setReactInput(el: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
    if (!el) return;
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function waitForEl<T extends Element>(finder: () => T | null, timeout = 12000): Promise<T | null> {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
        const found = finder();
        if (found) return found;
        await sleep(100);
    }
    return null;
}

/** ZHUQUE (zhuque.in) — Ant Design SPA tracker (experimental). */
export class ZhuqueEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return /^\/torrent\/(?:info|list)\/\d+/i.test(url.pathname || '');
    }

    async parse(): Promise<TorrentMeta> {
        const card0 = $('div.ant-card-body').eq(0);
        const title = (card0.find('span').first().text() || document.title).trim();
        const smallDescr = card0.find('span').eq(1).text().trim();
        const infoText = card0.text();
        const imdbUrl = matchLink('imdb', document.body.innerHTML) || '';
        const dlHref = $('a[href*="/api/torrent/download/"]').first().attr('href') || '';
        const mediainfo = $('div.ant-collapse-content-box').eq(1).find('span').eq(0).text().trim();
        const imgs: string[] = [];
        $('div.ant-card-body').eq(2).find('img').each((_, el) => {
            const src = $(el).attr('src') || '';
            if (src) imgs.push(src);
        });
        const parts: string[] = [];
        if (mediainfo) parts.push(`[quote]\n${mediainfo}\n[/quote]`);
        if (imgs.length) parts.push(imgs.map((s) => `[img]${s}[/img]`).join('\n'));
        const description = parts.join('\n\n').trim();
        const combined = `${title} ${infoText} ${description}`;
        return {
            title,
            smallDescr: smallDescr || undefined,
            subtitle: smallDescr || undefined,
            description,
            fullMediaInfo: mediainfo || undefined,
            type: getType(combined) || '电影',
            mediumSel: getMediumSel(combined, title),
            standardSel: getStandardSel(combined),
            codecSel: getCodecSel(combined),
            audioCodecSel: getAudioCodecSel(combined),
            sourceSite: this.siteName,
            sourceUrl: this.currentUrl,
            imdbUrl: imdbUrl || undefined,
            imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
            torrentUrl: dlHref ? new URL(dlHref, this.currentUrl).href : undefined,
            images: imgs
        };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        const titleEl = await waitForEl(() => document.getElementById('form_item_title') as HTMLInputElement | null, 10000);
        if (!titleEl) return;
        setReactInput(titleEl, meta.targetTitle || meta.title || '');
        setReactInput(document.getElementById('form_item_subtitle') as HTMLInputElement | null, meta.smallDescr || meta.subtitle || '');

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        if (imdbId) {
            const imdbEl = document.querySelector('input[placeholder="tt123456"]') as HTMLInputElement | null;
            setReactInput(imdbEl, imdbId);
        }

        const rawDescr = `${meta.fullMediaInfo || ''}\n${meta.description || ''}`.trim();
        const info = getMediainfoPictureFromDescr(rawDescr, { mediumSel: meta.mediumSel });
        const mi = (meta.fullMediaInfo || info.mediainfo || '').trim();
        setReactInput(document.getElementById('form_item_mediainfo') as HTMLTextAreaElement | null, mi || meta.description || '');

        const triggerAntSelect = async (id: string, value: string, delay = 250) => {
            const el = document.getElementById(id);
            if (!el || !value) return;
            el.dispatchEvent(new Event('mousedown', { bubbles: true }));
            el.click();
            await sleep(delay);
            const opts = Array.from(document.querySelectorAll('div.ant-select-item-option-content'));
            const match = opts.find((o) => (o.textContent || '').trim() === value) || opts.find((o) => (o.textContent || '').includes(value));
            if (match) (match as HTMLElement).click();
        };

        const typeMap: Record<string, string> = { 电影: '电影', 剧集: '剧集', 动漫: '动画', 综艺: '节目' };
        await triggerAntSelect('form_item_category', typeMap[meta.type || ''] || '其它', 300);

        let med = 'Encode';
        if (meta.mediumSel === 'UHD') med = /DIY|@/i.test(meta.title || '') ? 'UHD Blu-ray DIY' : 'UHD Blu-ray';
        else if (meta.mediumSel === 'Blu-ray') med = /DIY|@/i.test(meta.title || '') ? 'Blu-ray DIY' : 'Blu-ray';
        else if (meta.mediumSel && ['Remux', 'HDTV', 'Encode', 'WEB-DL'].includes(meta.mediumSel)) med = meta.mediumSel;
        else if (meta.mediumSel === 'DVD') med = 'Other';
        if (/HDTV/i.test(meta.title || '') && meta.standardSel === '4K') med = 'UHDTV';
        await triggerAntSelect('rc_select_1', med, 300);

        const codecMap: Record<string, string> = { H265: 'H265', H264: 'H264', X265: 'x265', X264: 'x264' };
        await triggerAntSelect('rc_select_2', codecMap[meta.codecSel || ''] || 'Other', 300);

        const stdMap: Record<string, string> = { '4K': '2160p', '1080p': '1080p', '1080i': '1080i', '720p': '720p' };
        await triggerAntSelect('rc_select_3', stdMap[meta.standardSel || ''] || 'Other', 300);

        try {
            const { TorrentService } = await import('../services/TorrentService');
            const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, null);
            if (result) TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
        } catch (e) {
            console.error('[Auto-Feed][ZHUQUE] File Injection Failed:', e);
        }
    }
}

/** YemaPT (www.yemapt.org) — Ant Design form via `torrentAddPageReady` event (experimental). */
export class YemaPTEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(_url: URL): boolean {
        return false;
    }

    async parse(): Promise<TorrentMeta> {
        return { title: document.title, description: '', sourceSite: this.siteName, sourceUrl: this.currentUrl, images: [] };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        const settings = await SettingsService.load();
        const applyToForm = async (form: any) => {
            if (!form?.setFieldsValue) return;
            const rawDescr = meta.description || '';
            const info = getMediainfoPictureFromDescr(rawDescr, { mediumSel: meta.mediumSel });
            const poster = meta.images?.[0] || rawDescr.match(/\[img\](.*?)\[\/img\]/i)?.[1] || '';
            const payload: Record<string, any> = {
                showName: meta.targetTitle || meta.title || '',
                shortDesc: meta.smallDescr || meta.subtitle || '',
                longDesc: bbcodeToMarkdown(rawDescr)
            };
            if (poster) payload.picture = poster;
            if (settings.defaultAnonymous) payload.uploadUserAnonymous = 'y';
            const dbId = extractDoubanId(meta.doubanUrl || '');
            if (dbId) payload.douban = dbId;
            const imdbId = (meta.imdbId || extractImdbId(meta.imdbUrl || '') || '').replace(/^tt/i, '');
            if (imdbId) payload.imdb = imdbId;
            const seasonMatch = (meta.title || '').match(/S(\d+)/i);
            if (seasonMatch && ['剧集', '综艺', '动漫', '纪录'].includes(meta.type || '')) {
                payload.season = parseInt(seasonMatch[1], 10);
            }
            if (info.picInfo) {
                const urls = Array.from(info.picInfo.matchAll(/\[img\](.*?)\[\/img\]/gi)).map((m) => m[1].trim()).filter(Boolean);
                if (urls.length) payload.screenshotList = Array.from(new Set(urls));
            }
            form.setFieldsValue(payload);
            try {
                const { TorrentService } = await import('../services/TorrentService');
                const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, null);
                if (result) TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
            } catch {}
        };

        window.addEventListener('torrentAddPageReady', (e: any) => {
            applyToForm(e?.detail?.form).catch(() => {});
        }, { once: true });

        // Also try fallback standard inputs if the React page is already hydrated without firing the event again.
        const nameInput = document.querySelector('input[id*="showName"], input[name="showName"]') as HTMLInputElement | null;
        if (nameInput) {
            setReactInput(nameInput, meta.targetTitle || meta.title || '');
        }
    }
}

/** RouSi (rousi.pro) — React Radix UI upload form (experimental). */
export class RouSiEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(_url: URL): boolean {
        return false;
    }

    async parse(): Promise<TorrentMeta> {
        return { title: document.title, description: '', sourceSite: this.siteName, sourceUrl: this.currentUrl, images: [] };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        const titleEl = await waitForEl(() => document.querySelector('#torrent-title') as HTMLInputElement | null, 10000);
        if (!titleEl) return;
        const settings = await SettingsService.load();

        setReactInput(titleEl, meta.targetTitle || meta.title || '');
        setReactInput(document.querySelector('#torrent-subtitle') as HTMLInputElement | null, meta.smallDescr || meta.subtitle || '');
        if (meta.imdbUrl || meta.imdbId) {
            setReactInput(document.querySelector('#torrent-imdb-id') as HTMLInputElement | null, meta.imdbUrl || `https://www.imdb.com/title/${meta.imdbId}/`);
        }
        if (meta.doubanUrl) {
            setReactInput(document.querySelector('#torrent-douban-id') as HTMLInputElement | null, meta.doubanUrl);
        }

        const selectRadix = async (selector: string, label: string) => {
            const trigger = document.querySelector(selector) as HTMLElement | null;
            if (!trigger || !label) return;
            if ((trigger.querySelector('[data-slot="select-value"]')?.textContent || '').trim() === label) return;
            trigger.click();
            await sleep(150);
            const listboxId = trigger.getAttribute('aria-controls') || '';
            const container = (listboxId && document.getElementById(listboxId)) || document;
            const opt = Array.from(container.querySelectorAll('[role="option"]')).find((o) => (o.textContent || '').trim() === label) as HTMLElement | undefined;
            opt?.click();
            await sleep(80);
        };

        const typeMap: Record<string, string> = { 电影: '电影', 剧集: '电视剧', 动漫: '动漫', 综艺: '综艺', 音乐: '音乐', 纪录: '纪录片', 体育: '体育', MV: '音乐', 软件: '软件' };
        await selectRadix('#torrent-category', typeMap[meta.type || ''] || '其他');

        const stdMap: Record<string, string> = { '4K': '4K / 2160p', '2160p': '4K / 2160p', '1080p': '1080p', '1080i': '1080i', '720p': '720p', SD: 'SD' };
        await selectRadix('#torrent-facet-resolution', stdMap[meta.standardSel || ''] || '其他');

        const medMap: Record<string, string> = { 'Blu-ray': 'Blu-ray', UHD: 'UHD Blu-ray', Remux: 'Blu-ray', Encode: 'Blu-ray', 'WEB-DL': 'WEB-DL', HDTV: 'HDTV', DVD: 'DVDRip' };
        await selectRadix('#torrent-facet-source', medMap[meta.mediumSel || ''] || '其他');

        setReactInput(document.querySelector('#torrent-description') as HTMLTextAreaElement | null, bbcodeToMarkdown(meta.description || ''));
        const info = getMediainfoPictureFromDescr(`${meta.fullMediaInfo || ''}\n${meta.description || ''}`);
        setReactInput(document.querySelector('#torrent-media-info') as HTMLTextAreaElement | null, (meta.fullMediaInfo || info.mediainfo || '').trim());

        if (settings.defaultAnonymous) {
            const cb = document.querySelector('[role="checkbox"][aria-labelledby="torrent-anonymous-label"]') as HTMLElement | null;
            if (cb && cb.getAttribute('aria-checked') !== 'true') cb.click();
        }

        try {
            const { TorrentService } = await import('../services/TorrentService');
            const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, null);
            if (result) TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
        } catch {}
    }
}

/** HDCity (hdcity.city) — 2-step `/upload` -> `/upload?...` (experimental). */
export class HDCityEngine extends NexusPHPEngine {
    private static readonly STEP_META_KEY = 'autofeed_hdcity_step_meta';

    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    async recoverForwardMeta(): Promise<TorrentMeta | null> {
        if (!document.getElementById('bigname')) return null;
        try {
            const raw = await GMAdapter.getValue<string | null>(HDCityEngine.STEP_META_KEY, null);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { meta?: TorrentMeta; ts?: number };
            if (!parsed?.meta || !parsed.ts || Date.now() - parsed.ts > 15 * 60_000) {
                await GMAdapter.deleteValue(HDCityEngine.STEP_META_KEY);
                return null;
            }
            return parsed.meta;
        } catch {
            return null;
        }
    }

    async onNonUploadPage(): Promise<void> {
        try { await GMAdapter.deleteValue(HDCityEngine.STEP_META_KEY); } catch {}
    }

    async fill(meta: TorrentMeta): Promise<void> {
        const settings = await SettingsService.load();
        const isStep2 = !!document.getElementById('bigname');
        if (!isStep2) {
            await GMAdapter.setValue(HDCityEngine.STEP_META_KEY, JSON.stringify({ meta, ts: Date.now() }));
            const qr = document.getElementById('qr') as HTMLButtonElement | null;
            if (qr) qr.disabled = false;
            setFirstFormValue('#name, input[name="name"]', meta.targetTitle || meta.title || '');
            try {
                const { TorrentService } = await import('../services/TorrentService');
                const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, null);
                if (result) TorrentService.injectTorrentForSite(this.siteName, result.file, result.filename);
            } catch {}
            return;
        }

        setFirstFormValue('#bigname', meta.targetTitle || meta.title || '');
        setAllFormValues('input[name="small_descr"]', meta.smallDescr || meta.subtitle || '');
        setAllFormValues('input[name="url"]', meta.imdbUrl || '');
        const poster = meta.images?.[0] || (meta.description || '').match(/\[img\](\S+?)\[\/img\]/i)?.[1] || '';
        if (poster) setAllFormValues('input[name="posterimg"]', poster);
        const info = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
        const mi = (meta.fullMediaInfo || info.mediainfo || '').trim();
        if (mi) setFirstFormValue('#mediainfo', mi, { force: true });
        setFirstFormValue('#descr, textarea[name="descr"]', meta.description || '', { force: true });

        const selectIndex = (name: string, idx: number) => {
            const sel = (name === 'browsecat'
                ? document.getElementById('browsecat')
                : document.getElementsByName(name)[0]) as HTMLSelectElement | null | undefined;
            if (sel && sel.options[idx]) {
                sel.selectedIndex = idx;
                dispatchFormEvents(sel);
            }
        };
        const typeIdx: Record<string, number> = {
            电影: 1, 剧集: 2, 纪录: 3, 动漫: 4, 综艺: 5, MV: 6, 体育: 7, 音乐: 8, 学习: 10, 软件: 11, '': 12
        };
        if (typeIdx[meta.type || ''] !== undefined) selectIndex('browsecat', typeIdx[meta.type || '']);
        const medIdx: Record<string, number> = { UHD: 1, 'Blu-ray': 1, DVD: 2, Remux: 3, Encode: 4, HDTV: 6, 'WEB-DL': 6 };
        if (meta.mediumSel && medIdx[meta.mediumSel] !== undefined) selectIndex('medium_sel', medIdx[meta.mediumSel]);
        const codecIdx: Record<string, number> = { H264: 1, X264: 1, H265: 2, X265: 2, 'MPEG-2': 3, 'MPEG-4': 3, XVID: 4, 'VC-1': 5 };
        if (meta.codecSel && codecIdx[meta.codecSel] !== undefined) selectIndex('codec_sel', codecIdx[meta.codecSel]);
        const stdIdx: Record<string, number> = { '4K': 3, '1080p': 5, '1080i': 6, '720p': 7, SD: 11 };
        if (meta.standardSel && stdIdx[meta.standardSel] !== undefined) selectIndex('standard_sel', stdIdx[meta.standardSel]);

        if (settings.defaultAnonymous) {
            const uplver = document.getElementsByName('uplver')[0] as HTMLInputElement | undefined;
            if (uplver) { uplver.checked = true; dispatchFormEvents(uplver); }
        }
        await GMAdapter.deleteValue(HDCityEngine.STEP_META_KEY);
    }
}

/** BYR (byr.pt) — Edu NexusPHP with HTML descr & movie sub-fields (experimental). */
export class BYREngine extends NexusPHPEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    async fill(meta: TorrentMeta): Promise<void> {
        await super.fill(meta);
        const origDescr = meta.description || '';
        let htmlDescr = origDescr
            .replace(/^\n+/, '')
            .replace(/\n/g, '<br />')
            .replace(/\[(quote|quote=.+?|hide=.+?)\]/gi, '<fieldset style="font-family: Consolas,sans-serif"><legend><span style="color:white;background-color:black">&nbsp;引用&nbsp;</span></legend>')
            .replace(/\[(\/)?(quote|hide)\]/gi, '<$1fieldset>')
            .replace(/\[color=(.+?)\]/gi, '<span style="color: $1">')
            .replace(/\[\/color\]/gi, '</span>')
            .replace(/\[size=(.+?)\]/gi, '<font size="$1">')
            .replace(/\[\/size\]/gi, '</font>')
            .replace(/\[url=(.+?)\](.+?)\[\/url\]/gi, '<a href="$1">$2</a>')
            .replace(/\[(\/)?b\]/gi, '<$1strong>')
            .replace(/\[img\](.+?)\[\/img\]/gi, '<img src="$1"/>');
        setFirstFormValue('textarea', htmlDescr, { force: true });

        if ((meta.type || '电影') === '电影') {
            const src = meta.sourceSel || '';
            if (['大陆', '台湾', '香港', '港台'].includes(src)) {
                setAllFormValues('select[name="second_type"]', '11');
                setAllFormValues('input[name="movie_country"]', '华语');
            } else if (['日本', '韩国', '印度'].includes(src)) {
                setAllFormValues('select[name="second_type"]', '14');
                setAllFormValues('input[name="movie_country"]', '亚洲');
            } else if (src === '欧美') {
                const isUs = /(?:◎产.*地|◎地.*区|◎国.*家)[^\n]*(?:美国|北美)/.test(origDescr);
                setAllFormValues('select[name="second_type"]', isUs ? '13' : '12');
                setAllFormValues('input[name="movie_country"]', isUs ? '北美' : '欧洲');
            }
            setAllFormValues('input[name="movie_ename0day"]', (meta.targetTitle || meta.title || '').replace(/ /g, '.'));
            const cnameLine = origDescr.match(/(?:◎译.*名|◎片.*名)([^\n]+)/)?.[1]?.trim() || '';
            if (/[\u4e00-\u9fa5]/.test(cnameLine)) {
                const cname = cnameLine.replace(/\s+/g, '').split('/').slice(0, 2).join('/');
                setAllFormValues('input[name="movie_cname"]', cname);
            }
            const genreLine = origDescr.match(/◎类.*别([^\n]+)/)?.[1]?.replace(/\s+/g, '') || '';
            if (genreLine) {
                setAllFormValues('input[name="movie_type"]', genreLine.split('/').slice(0, 3).join('/'));
            }
        }
    }
}
