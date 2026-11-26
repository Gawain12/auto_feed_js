import { getUiText } from '../ui/i18n';
import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { SettingsService } from './SettingsService';
import { PtgenService, PtgenApplyFlags, PtgenFetchResult, hasPtgenBlock, stripLeadingPtgenBlock } from './PtgenService';
import { GMAdapter } from './GMAdapter';
import { TorrentService } from './TorrentService';
import { TorrentMeta } from '../types/TorrentMeta';
import { isChineseNexusSite } from './SiteCatalogService';
import { extractDoubanId, extractImdbId } from '../common/rules/links';
import { getSourceSelFromDescr } from '../common/rules/helpers';
import { dispatchFormEvents } from '../common/dom/form';
import { resolveNexusProfileValues } from '../common/rules/nexusProfile';
import { setCmctDescrValue } from '../trackers/nexus/CMCT';

export class UploadMetaFetchService {
    static async tryInject(adapter: BaseEngine) {
        if (document.body.dataset.autofeedUploadFetch === '1') return;
        if (!isChineseNexusSite(adapter.siteName)) return;

        const $descr = $('textarea[name="descr"], textarea[name="description"], #descr, #description').first();
        if (!$descr.length) return;
        const text = getUiText((await SettingsService.load()).uiLanguage);
        const isCmct = adapter.siteName === 'CMCT';

        const bar = $(`
            <div id="autofeed-upload-fetch" style="margin: 6px 0; display: inline-flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <button type="button" style="background: #2c3e50; color: #fff; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">${text("点击获取", "Fetch metadata")}</button>
                <span style="font-size: 12px; color: #666;">${text("(外站豆瓣/ptgen)", "(Douban / PTGen metadata)")}</span>
            </div>
        `);

        // Apply options (legacy parity: users often want "只填空/不要插入简介/只要地区" etc.).
        // On CMCT, `#descr` is `附加信息` (CMCT renders Douban info automatically from `#url`), so default `简介` off there.
        const optWrap = $(`
            <span style="display:inline-flex; gap:8px; align-items:center; margin-left: 6px; font-size: 12px; color: #444;">
                <label style="display:inline-flex; gap:4px; align-items:center; cursor:pointer;">
                    <input type="checkbox" data-k="mergeDescription" ${isCmct ? '' : 'checked'} />${text("简介", "Description")}
                </label>
                <label style="display:inline-flex; gap:4px; align-items:center; cursor:pointer;">
                    <input type="checkbox" data-k="updateSubtitle" checked />${text("副标题", "Subtitle")}
                </label>
                <label style="display:inline-flex; gap:4px; align-items:center; cursor:pointer;">
                    <input type="checkbox" data-k="updateRegion" checked />${text("地区", "Region")}
                </label>
                <label style="display:inline-flex; gap:4px; align-items:center; cursor:pointer;">
                    <input type="checkbox" data-k="updateIds" checked />ID
                </label>
            </span>
        `);
        bar.append(optWrap);

        const btn = bar.find('button');
        btn.on('click', async () => {
            btn.text(text("获取中...", "Fetching..."));
            btn.prop('disabled', true);
            try {
                const settings = await SettingsService.load();
                const base: TorrentMeta = {
                    title: '',
                    description: '',
                    sourceSite: adapter.siteName,
                    sourceUrl: window.location.href,
                    images: []
                };

                const merged = this.applyInputs(base);
                const flags: PtgenApplyFlags = {};
                try {
                    optWrap.find('input[type="checkbox"]').each((_i, el) => {
                        const key = (el as HTMLInputElement).dataset.k as keyof PtgenApplyFlags | undefined;
                        if (!key) return;
                        (flags as any)[key] = (el as HTMLInputElement).checked;
                    });
                } catch {}

                const result = await PtgenService.fetchPtgen(merged, {
                    imdbToDoubanMethod: settings.imdbToDoubanMethod || 0,
                    ptgenApi: settings.ptgenApi ?? 3,
                    doubanCookie: settings.doubanCookie || undefined
                });
                if (!result || !result.format) {
                    throw new Error('No external meta fetched (missing IDs/blocked provider)');
                }

                // Surgically apply ONLY the checked PTGen fields without re-running full `adapter.fill()`
                // (which would wipe already-filled category/medium/codec/audio/resolution selects).
                const appliedCount = this.applyPtgenToForm(adapter, merged, result, flags);
                if (appliedCount === 0) {
                    throw new Error('No target fields updated');
                }
                btn.text(text("已更新", "Metadata updated"));
            } catch (err) {
                console.error('[Auto-Feed] Upload fetch error:', err);
                btn.text(text("未获取到", "No metadata found"));
            } finally {
                setTimeout(() => {
                    btn.prop('disabled', false);
                    btn.text(text("点击获取", "Fetch metadata"));
                }, 1500);
            }
        });

        const editorWrap = $descr.closest('.bbcode-editor');
        if (editorWrap.length) {
            editorWrap.before(bar);
        } else {
            $descr.before(bar);
        }
        document.body.dataset.autofeedUploadFetch = '1';
    }

    private static readActiveDescr(descrEl: HTMLTextAreaElement | null): string {
        if (!descrEl) return '';
        try {
            const pageWin = (typeof (globalThis as any).unsafeWindow !== 'undefined'
                ? (globalThis as any).unsafeWindow
                : window) as any;
            const inst =
                pageWin?.sceditor?.instance?.(descrEl) ||
                (pageWin?.jQuery && pageWin.jQuery(descrEl)?.sceditor?.('instance')) ||
                ((window as any).sceditor?.instance?.(descrEl));
            if (inst && typeof inst.val === 'function') {
                return String(inst.val() || '');
            }
        } catch {}
        return descrEl.value || '';
    }

    private static applyPtgenToForm(
        adapter: BaseEngine,
        merged: TorrentMeta,
        result: PtgenFetchResult,
        flags: PtgenApplyFlags
    ): number {
        const siteName = adapter.siteName;
        const config = adapter.getConfig();
        let changes = 0;

        const imdbId = extractImdbId(result.format) || merged.imdbId || '';
        const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : (merged.imdbUrl || '');
        const doubanId = result.doubanId || extractDoubanId(result.format) || merged.doubanId || '';
        const doubanUrl = doubanId ? `https://movie.douban.com/subject/${doubanId}/` : (merged.doubanUrl || '');

        // 1. IDs (IMDb / Douban / PT-Gen URL)
        if (flags.updateIds !== false) {
            if (siteName === 'CMCT') {
                const preferred = doubanUrl || imdbUrl;
                if (preferred) {
                    const urlInputs = Array.from(document.querySelectorAll('input[name="url"], input#url')) as HTMLInputElement[];
                    urlInputs.forEach((input) => {
                        input.value = preferred;
                        dispatchFormEvents(input);
                        changes += 1;
                    });
                }
            } else {
                const imdbSel =
                    config.selectors?.imdbInput ||
                    'input[name="imdb_id"], input[name="imdbid"], input[name="imdb"], input[name="imdb_url"], input[name="imdburl"], input[name="pt_gen[imdb][link]"], input[name="url"][type="text"], input[name="url"][type="url"]';
                if (imdbUrl || imdbId) {
                    document.querySelectorAll(imdbSel).forEach((node) => {
                        const input = node as HTMLInputElement;
                        const nm = (input.getAttribute('name') || '').toLowerCase();
                        input.value = nm === 'imdb_id' || nm === 'imdbid' ? (imdbId || imdbUrl) : (imdbUrl || imdbId);
                        dispatchFormEvents(input);
                        changes += 1;
                    });
                }
                const doubanSel =
                    config.selectors?.doubanInput ||
                    'input[name="douban"], input[name="douban_id"], input[name="doubanid"], input[name="douban_url"], input[name="dburl"], input[name="url_douban"], input[name="durl"], input[name="pt_gen[douban][link]"]';
                const preferNumeric = ['TTG', 'HDDolby', 'BTSchool'].includes(siteName);
                if (doubanUrl || doubanId) {
                    document.querySelectorAll(doubanSel).forEach((node) => {
                        const input = node as HTMLInputElement;
                        const nm = (input.getAttribute('name') || '').toLowerCase();
                        input.value =
                            nm === 'doubanid' || (preferNumeric && nm.includes('douban') && nm.includes('id'))
                                ? (doubanId || doubanUrl)
                                : (doubanUrl || doubanId);
                        dispatchFormEvents(input);
                        changes += 1;
                    });
                }
                const ptGenVal = doubanUrl || imdbUrl;
                if (ptGenVal) {
                    document.querySelectorAll('input[name="pt_gen"]').forEach((node) => {
                        const input = node as HTMLInputElement;
                        input.value = ptGenVal;
                        dispatchFormEvents(input);
                        changes += 1;
                    });
                }
            }
        }

        // 2. Subtitle (`small_descr`)
        if (flags.updateSubtitle !== false) {
            let subtitle = PtgenService.extractSubtitle(result.format, merged.title || '');
            if (subtitle) {
                if (siteName === 'CMCT') {
                    subtitle = subtitle.replace(/【/g, '[').replace(/】/g, ']');
                }
                const subSel =
                    config.selectors?.smallDescrInput ||
                    'input[name="small_descr"], input[name="small_desc"], input[name="subhead"]';
                const subInput = document.querySelector(subSel) as HTMLInputElement | null;
                if (subInput) {
                    subInput.value = subtitle;
                    dispatchFormEvents(subInput);
                    changes += 1;
                }
            }
        }

        // 3. Region (`source_sel` / PTer `team_sel` / profile `source`)
        if (flags.updateRegion !== false) {
            const region = getSourceSelFromDescr(result.format);
            if (region) {
                if (this.applyRegionSelectOnly(siteName, config, region, result.format)) {
                    changes += 1;
                }
            }
        }

        // 4. Description (`#descr` — deduplicating any existing leading PTGen block, and syncing SCEditor)
        if (flags.mergeDescription !== false) {
            const descrSel = config.selectors?.descrInput || 'textarea[name="descr"], textarea[name="description"], #descr, #description';
            const descrEl = document.querySelector(descrSel) as HTMLTextAreaElement | null;
            if (descrEl) {
                const cur = this.readActiveDescr(descrEl).trim();
                const rest = hasPtgenBlock(cur) ? stripLeadingPtgenBlock(cur) : cur;
                const nextDescr = rest ? `${result.format}\n\n${rest}` : result.format;
                if (siteName === 'CMCT') {
                    setCmctDescrValue(nextDescr);
                } else {
                    descrEl.value = nextDescr;
                    dispatchFormEvents(descrEl);
                }
                changes += 1;
            }
        }

        // 5. Standalone cover input on non-CMCT sites (CMCT auto-fetches Douban poster when left blank)
        if (siteName !== 'CMCT' && result.poster) {
            const coverEl = document.querySelector('input[name="tr_cover_url"], input[name="cover"]') as HTMLInputElement | null;
            if (coverEl && !coverEl.value.trim()) {
                coverEl.value = result.poster;
                dispatchFormEvents(coverEl);
                changes += 1;
            }
        }

        return changes;
    }

    private static applyRegionSelectOnly(siteName: string, config: ReturnType<BaseEngine['getConfig']>, region: string, format: string): boolean {
        const setSelect = (sel: HTMLSelectElement | null, val: string): boolean => {
            if (!sel) return false;
            const opt = Array.from(sel.options).find((o) => o.value === val);
            if (!opt) return false;
            sel.value = opt.value;
            dispatchFormEvents(sel);
            return true;
        };

        if (siteName === 'CMCT') {
            let normalizedRegion = region;
            if (normalizedRegion === '港台') normalizedRegion = /台湾|臺灣/.test(format) ? '台湾' : '香港';
            else if (normalizedRegion === '日韩') normalizedRegion = /日本/.test(format) ? '日本' : '韩国';
            const sourceDict: Record<string, number> = { 欧美: 4, 大陆: 1, 香港: 2, 台湾: 3, 日本: 5, 韩国: 6, 印度: 7, 泰国: 9 };
            let val = sourceDict[normalizedRegion] ?? 99;
            if (/◎(地.{0,10}?区|国.{0,10}?家|产.{0,10}?地|◎產.{0,5}?地).*(俄罗斯|苏联)/i.test(format)) val = 8;
            return setSelect(document.querySelector('select[name="source_sel"], #source_sel') as HTMLSelectElement | null, String(val));
        }

        if (siteName === 'PTer') {
            const teamDict: Record<string, number> = { 欧美: 4, 大陆: 1, 香港: 2, 台湾: 3, 日本: 6, 韩国: 5, 印度: 7 };
            const val = teamDict[region] ?? 8;
            const sel =
                (document.querySelector('select[name="team_sel"]') as HTMLSelectElement | null) ||
                (document.querySelector('select[name="team"]') as HTMLSelectElement | null);
            return setSelect(sel, String(val));
        }

        if (config.nexusProfile?.source) {
            const items = resolveNexusProfileValues(
                { sourceSel: region, description: format },
                { source: config.nexusProfile.source }
            );
            for (const item of items) {
                const sel =
                    (document.querySelector(`select[name="${item.selector}"]`) as HTMLSelectElement | null) ||
                    (document.querySelector(`select[name^="${item.selector}"]`) as HTMLSelectElement | null);
                if (!sel) continue;
                if (typeof item.value === 'string') {
                    if (setSelect(sel, item.value)) return true;
                } else {
                    const opt = sel.options[item.value.index];
                    if (opt) {
                        sel.selectedIndex = item.value.index;
                        opt.selected = true;
                        dispatchFormEvents(sel);
                        return true;
                    }
                }
            }
        }

        const regionMap: Record<string, RegExp[]> = {
            大陆: [/大陆|内地|中国|Mainland|China/i],
            香港: [/香港|HK|Hong/i],
            台湾: [/台湾|台灣|TW|Taiwan/i],
            港台: [/港台|香港|台湾/i],
            欧美: [/欧美|歐美|美国|英国|West|Europe|US/i],
            日本: [/日本|JP|Japan/i],
            韩国: [/韩国|韓國|KR|Korea/i],
            日韩: [/日韩|日本|韩国/i],
            印度: [/印度|India/i],
            泰国: [/泰国|Thailand/i]
        };
        const patterns = regionMap[region];
        if (!patterns) return false;

        const candidates = [
            document.querySelector('select[name="source_sel"]'),
            document.querySelector('select[name="source_sel[4]"]'),
            document.querySelector('select[name="area"]')
        ].filter(Boolean) as HTMLSelectElement[];

        for (const sel of candidates) {
            const allText = Array.from(sel.options).map((o) => o.textContent || '').join(' ');
            if (!/欧美|大陆|香港|台湾|日本|韩国|Mainland|West/i.test(allText)) continue;
            const hit = Array.from(sel.options).find((o) => patterns.some((re) => re.test(o.textContent || '')));
            if (hit) {
                sel.value = hit.value;
                dispatchFormEvents(sel);
                return true;
            }
        }
        return false;
    }

    private static applyInputs(meta: TorrentMeta): TorrentMeta {
        const next = { ...meta };
        const rawInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
        const rawTextareas = Array.from(document.querySelectorAll('textarea')) as HTMLTextAreaElement[];
        const titleInput = document.querySelector('input[name="name"], #name') as HTMLInputElement | null;
        if (titleInput?.value?.trim()) {
            next.title = titleInput.value.trim();
        }
        const descrEl =
            (document.querySelector('textarea[name="descr"]') as HTMLTextAreaElement | null) ||
            (document.querySelector('textarea[name="description"]') as HTMLTextAreaElement | null) ||
            (document.getElementById('descr') as HTMLTextAreaElement | null) ||
            (document.getElementById('description') as HTMLTextAreaElement | null);
        const currentDescr = this.readActiveDescr(descrEl);
        const values = [
            ...rawInputs.map((input) => input.value || ''),
            // Legacy parity: users often paste IMDb/Douban links into the description textarea.
            ...rawTextareas.map((ta) => ta.value || ''),
            currentDescr
        ].filter(Boolean);

        if (currentDescr.trim()) {
            next.description = currentDescr;
        }

        const hintText = (el: HTMLInputElement) =>
            `${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
        const imdbFieldValues = rawInputs
            .filter((input) => /imdb/.test(hintText(input)))
            .map((input) => String(input.value || '').trim())
            .filter(Boolean);
        const doubanFieldValues = rawInputs
            .filter((input) => /douban/.test(hintText(input)))
            .map((input) => String(input.value || '').trim())
            .filter(Boolean);

        // Generic fields may contain unrelated numeric values (e.g. TTG type ids).
        // Only accept strict `tt\d+`/URL patterns from free text to avoid false positives.
        const imdbIdFromFreeText = values
            .map((v) => String(v || '').match(/tt\d{5,13}/i)?.[0] || '')
            .find(Boolean) || '';
        const doubanIdFromFreeText = values
            .map((v) => String(v || '').match(/(?:douban\.com\/subject\/|subject\/)(\d{5,})/i)?.[1] || '')
            .find(Boolean) || '';
        const imdbUrlFromFreeText = values
            .map((v) => String(v || '').match(/https?:\/\/(?:www\.)?imdb\.com\/title\/tt\d{5,13}\/?/i)?.[0] || '')
            .find(Boolean) || '';
        const doubanUrlFromFreeText = values
            .map((v) => String(v || '').match(/https?:\/\/(?:movie\.)?douban\.com\/subject\/\d+\/?/i)?.[0] || '')
            .find(Boolean) || '';

        const imdbId = imdbFieldValues.map((v) => extractImdbId(v)).find(Boolean) || imdbIdFromFreeText;
        const doubanId = doubanFieldValues.map((v) => extractDoubanId(v)).find(Boolean) || doubanIdFromFreeText;
        const imdbUrl = imdbUrlFromFreeText || (imdbId ? `https://www.imdb.com/title/${imdbId}/` : '');
        const doubanUrl = doubanUrlFromFreeText || (doubanId ? `https://movie.douban.com/subject/${doubanId}/` : '');

        if (imdbId) next.imdbId = imdbId;
        if (imdbUrl) next.imdbUrl = imdbUrl;
        if (doubanId) next.doubanId = doubanId;
        if (doubanUrl) next.doubanUrl = doubanUrl;

        return next;
    }
}

type PendingAutoDownload = {
    siteName: string;
    host: string;
    createdAt: number;
    title?: string;
    tries?: number;
    lastTriedAt?: number;
};

export class AutoDownloadAfterUploadService {
    private static KEY = 'autofeed_pending_auto_download';
    private static TTL_MS = 30 * 60 * 1000;
    private static MAX_TRIES = 5;

    static async hookUploadForm(adapter: BaseEngine, meta?: Partial<TorrentMeta>) {
        const settings = await SettingsService.load();
        if (!settings.autoDownloadAfterUpload) return;

        const form = this.findLikelyUploadForm();
        if (!form) return;

        const anyForm = form as any;
        if (anyForm.__autofeedAutoDownloadHooked) return;
        anyForm.__autofeedAutoDownloadHooked = true;

        form.addEventListener(
            'submit',
            () => {
                const pending: PendingAutoDownload = {
                    siteName: adapter.siteName,
                    host: window.location.host,
                    createdAt: Date.now(),
                    title: meta?.title || ''
                };
                GMAdapter.setValue(this.KEY, JSON.stringify(pending)).catch(() => {});
            },
            true
        );
    }

    static async tryAutoDownload(adapter: BaseEngine, isUploadLikePage: boolean) {
        const settings = await SettingsService.load();
        const text = getUiText(settings.uiLanguage);
        if (!settings.autoDownloadAfterUpload) return;
        if (isUploadLikePage) return;

        const raw = await GMAdapter.getValue<string | null>(this.KEY, null);
        if (!raw) return;

        let pending: PendingAutoDownload | null = null;
        try {
            pending = JSON.parse(raw) as PendingAutoDownload;
        } catch {
            await GMAdapter.deleteValue(this.KEY);
            return;
        }

        if (!pending || pending.siteName !== adapter.siteName) return;

        const now = Date.now();
        if (!pending.createdAt || now - pending.createdAt > this.TTL_MS) {
            await GMAdapter.deleteValue(this.KEY);
            return;
        }

        if (pending.host && pending.host !== window.location.host) {
            // Same "siteName" but different host; ignore without deleting.
            return;
        }

        const tries = Number(pending.tries || 0);
        if (tries >= this.MAX_TRIES) {
            await GMAdapter.deleteValue(this.KEY);
            return;
        }

        // Avoid tight retry loops on SPA navigations.
        const last = Number(pending.lastTriedAt || 0);
        if (last && now - last < 5_000) return;

        const downloadUrl = this.findTorrentDownloadUrl();
        if (!downloadUrl) {
            pending.tries = tries + 1;
            pending.lastTriedAt = now;
            await GMAdapter.setValue(this.KEY, JSON.stringify(pending));
            return;
        }

        pending.lastTriedAt = now;
        await GMAdapter.setValue(this.KEY, JSON.stringify(pending));

        const safe = TorrentService.normalizeTorrentName(pending.title || document.title || adapter.siteName) || 'autofeed';
        const filename = safe.endsWith('.torrent') ? safe : `${safe}.torrent`;

        try {
            await this.downloadTorrent(downloadUrl, filename);
            await GMAdapter.deleteValue(this.KEY);
            this.toast(text("已自动下载种子", "Torrent file downloaded"), 'ok');
        } catch (e) {
            pending.tries = tries + 1;
            pending.lastTriedAt = now;
            await GMAdapter.setValue(this.KEY, JSON.stringify(pending));
            this.toast(text("自动下载失败（稍后可刷新重试）", "Torrent download failed. Refresh the page to try again."), 'err');
        }
    }

    private static findLikelyUploadForm(): HTMLFormElement | null {
        // Prefer forms containing a file input; this is robust across Nexus/Unit3D/Gazelle.
        const forms = Array.from(document.querySelectorAll('form')) as HTMLFormElement[];
        const hasFile = (f: HTMLFormElement) => !!f.querySelector('input[type="file"]');
        const uploadish = (f: HTMLFormElement) => {
            const action = (f.getAttribute('action') || '').toLowerCase();
            return action.includes('upload') || action.includes('takeupload') || action.includes('torrents');
        };
        return forms.find((f) => hasFile(f) && uploadish(f)) || forms.find((f) => hasFile(f)) || null;
    }

    private static findTorrentDownloadUrl(): string | null {
        const anchors = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
        const candidates = anchors
            .map((a) => {
                const href = a.getAttribute('href') || '';
                if (!href) return null;
                const text = (a.textContent || '').trim();
                const cls = (a.getAttribute('class') || '').toLowerCase();
                let score = 0;
                if (/download\.php/i.test(href)) score += 4;
                if (/download\.php\?.*id=\d+/i.test(href)) score += 5;
                if (/torrents\/download/i.test(href)) score += 6;
                if (/\/download\/\d+/i.test(href)) score += 3;
                if (/\.torrent(\?|$)/i.test(href)) score += 4;
                if (/download|下载|种子/i.test(text)) score += 2;
                if (cls.includes('download')) score += 1;
                if ((a as any).download) score += 1;
                return { a, href, score };
            })
            .filter(Boolean) as { a: HTMLAnchorElement; href: string; score: number }[];

        if (!candidates.length) return null;
        candidates.sort((x, y) => y.score - x.score);
        const best = candidates[0];

        try {
            return new URL(best.href, window.location.href).href;
        } catch {
            return best.href;
        }
    }

    private static async downloadTorrent(url: string, filename: string): Promise<void> {
        // Prefer GM_download when available (better download UX).
        if (typeof (globalThis as any).GM_download === 'function') {
            await new Promise<void>((resolve, reject) => {
                try {
                    (globalThis as any).GM_download({
                        url,
                        name: filename,
                        onload: () => resolve(),
                        onerror: (e: any) => reject(e || new Error('GM_download failed')),
                        ontimeout: () => reject(new Error('GM_download timeout'))
                    });
                } catch (e) {
                    reject(e);
                }
            });
            return;
        }

        // Fallback: fetch as blob and trigger a download.
        const res = await GMAdapter.xmlHttpRequest({ method: 'GET', url, responseType: 'blob' });
        const blob = res.response as Blob;
        if (!blob) throw new Error('Empty torrent blob');

        const objUrl = URL.createObjectURL(blob);
        try {
            const a = document.createElement('a');
            a.href = objUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            URL.revokeObjectURL(objUrl);
        }
    }

    private static toast(text: string, kind: 'ok' | 'err' | 'info' = 'info') {
        const colors: Record<string, string> = {
            ok: '#2ecc71',
            err: '#e74c3c',
            info: '#3498db'
        };
        const div = document.createElement('div');
        div.textContent = text;
        div.style.cssText = [
            'position:fixed',
            'bottom:16px',
            'left:50%',
            'transform:translateX(-50%)',
            'z-index:99999',
            'padding:8px 10px',
            `background:${colors[kind] || colors.info}`,
            'color:#fff',
            'border-radius:8px',
            'font-size:12px',
            'box-shadow:0 8px 22px rgba(0,0,0,0.22)',
            'max-width:calc(100vw - 20px)'
        ].join(';');
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2200);
    }
}
