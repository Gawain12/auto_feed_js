import { getUiText } from '../ui/i18n';
import { SiteRegistry } from './SiteRegistry';
import { BaseEngine } from './BaseEngine';
import $ from 'jquery';
import { StorageService } from '../services/StorageService';
import { QuickLinkService } from '../services/QuickLinkService';
import { ForwardLinkService } from '../services/ForwardLinkService';
import { PageEnhancerService, QuickSearchService } from '../services/PageEnhancerService';
import { RemoteDownloadService } from '../services/RemoteDownloadService';
import { ImageHostService } from '../services/ImageHostService';
import { UploadMetaFetchService, AutoDownloadAfterUploadService } from '../services/UploadMetaFetchService';
import { EmbedService } from '../services/EmbedService';
import { ImdbAspectRatioService } from '../services/ImdbAspectRatioService';
import { isUploadLikeUrl } from '../common/rules/pages';

export class SiteManager {
    private activeEngine: BaseEngine | null = null;

    constructor() {
        this.detectSite();
    }

    private detectSite() {
        const url = window.location.href;
        console.log(`[Auto-Feed] Detecting site for URL: ${url}`);

        this.activeEngine = SiteRegistry.getEngine(url);

        if (this.activeEngine) {
            console.log(`[Auto-Feed] Active Engine: ${this.activeEngine.siteName}`);
        } else {
            console.log('[Auto-Feed] No matching engine found for this site.');
        }
    }

    async run() {
        try {
            await ImdbAspectRatioService.tryHandleCurrentPage();
        } catch (e) {
            console.error('[Auto-Feed] IMDb Aspect Cache Error:', e);
        }

        // Page-level enhancers (PTP/HDB ratings etc.)
        try {
            await PageEnhancerService.tryEnhance();
        } catch (e) {
            console.error('[Auto-Feed] PageEnhancer Error:', e);
        }

        // Douban/IMDb quick search tools
        try {
            await QuickSearchService.tryInject();
        } catch (e) {
            console.error('[Auto-Feed] QuickSearch Error:', e);
        }

        // Image host upload bridge (imgbox/hdbimg/etc.)
        try {
            await ImageHostService.tryInjectImageQueueBridge();
        } catch (e) {
            console.error('[Auto-Feed] ImageHost Error:', e);
        }

        // Remote download sidebar
        try {
            await RemoteDownloadService.tryInject();
        } catch (e) {
            console.error('[Auto-Feed] RemoteDownload Error:', e);
        }

        // List-page quick search injection (independent of engine)
        try {
            await QuickSearchService.tryInjectList();
        } catch (e) {
            console.error('[Auto-Feed] ListSearch Error:', e);
        }

        if (!this.activeEngine) return;

        const adapter = this.activeEngine; // Alias for legacy code mindset
        // If we just uploaded via Auto-Feed, auto-download the newly created torrent on detail pages.
        try {
            AutoDownloadAfterUploadService.tryAutoDownload(adapter, isUploadLikeUrl(window.location.href)).catch(() => {});
        } catch {}

        const uploadLikePage = isUploadLikeUrl(window.location.href);
        if (!uploadLikePage) {
            try { await adapter.onNonUploadPage(); } catch {}
            try {
                await StorageService.clearPendingForward();
            } catch {}
        }
        if (uploadLikePage) {
            try {
                await UploadMetaFetchService.tryInject(adapter);
            } catch (e) {
                console.error('[Auto-Feed] UploadMetaFetch Error:', e);
            }
        }

        // 1. INJECT UI IMMEDIATELY (Non-blocking)
        // Source Mode: Only show on "real" detail pages (legacy parity: don't show on list/home/etc.)
        if (adapter.isSourcePage(new URL(window.location.href))) {
            // Embedded transfer/search UI injection on source detail pages.
            this.injectEmbeddedUI(adapter).catch(err => console.error('[Auto-Feed] Injection Error:', err));
            // Some BHD pages hydrate details after document-end; run one delayed retry.
            if (adapter.siteName === 'BHD') {
                setTimeout(() => {
                    this.injectEmbeddedUI(adapter).catch(() => { });
                }, 1300);
            }
        }

        // 2. CHECK FOR FORWARD HANDOFF (Target Mode)
        try {
            if (uploadLikePage) {
                const hasToken = !!StorageService.getHandoffTokenFromUrl();
                const handoffMeta = await StorageService.consumeHandoffFromCurrentUrl();
                const markerToken = handoffMeta ? null : StorageService.consumeWindowForwardToken(adapter.siteName);
                const markerMeta = markerToken ? await StorageService.consumeHandoff(markerToken) : null;
                let forwardMeta: any = null;
                if (handoffMeta || markerMeta) {
                    forwardMeta = handoffMeta || markerMeta;
                    await StorageService.clearPendingForward();
                    adapter.onForwardReceived();
                } else if (await StorageService.consumePendingForward(adapter.siteName)) {
                    forwardMeta = await StorageService.load();
                    if (forwardMeta) adapter.onForwardReceived();
                } else {
                    forwardMeta = await adapter.recoverForwardMeta();
                }
                if (forwardMeta) {
                    this.injectFillButton(adapter, forwardMeta);
                } else if (hasToken) {
                    const { SettingsService } = await import('../services/SettingsService');
                    const text = getUiText((await SettingsService.load()).uiLanguage);
                    this.showStatusToast(text('转发缓存已过期，请返回源站重新点击转发链接。', 'The forwarding data has expired. Open the source page and forward again.'));
                }
            }
        } catch (e) {
            console.error('[Auto-Feed] Handoff Load Error:', e);
        }
    }

    private async injectEmbeddedUI(adapter: BaseEngine) {
        console.log('[Auto-Feed] Starting injectEmbeddedUI for:', adapter.siteName);
        const { SettingsService } = await import('../services/SettingsService');
        const settings = await SettingsService.load();

        let meta: any = null;
        try {
            // Parse immediately, store, then inject DOM using legacy-ish layout.
            meta = await adapter.parse();
            const { normalizeMeta } = await import('../common/rules/normalize');
            meta = this.cleanMeta(meta);
            meta = normalizeMeta(meta, adapter.siteName);
            await StorageService.save(meta);
        } catch (e) {
            console.error('[Auto-Feed] Parse failed for embed, fallback to cached/minimal meta:', e);
        }

        if (!meta) {
            try {
                const cached = await StorageService.load();
                if (cached && (cached.sourceUrl === window.location.href || cached.sourceSite === adapter.siteName)) {
                    meta = cached;
                }
            } catch { }
        }
        if (!meta) {
            meta = {
                title: document.title || '',
                subtitle: '',
                description: '',
                sourceSite: adapter.siteName,
                sourceUrl: window.location.href,
                images: []
            };
        }

        try {
            await EmbedService.inject(adapter, meta, settings);
        } catch (e) {
            console.error('[Auto-Feed] Embed injection failed:', e);
        }
    }

    private async injectFillButton(adapter: BaseEngine, meta: any) {
        // Single instance (SPA-safe)
        $('#autofeed-founddata-toast').remove();

        let toastOpacity = 0.95;
        let text = getUiText();
        try {
            const settings = await import('../services/SettingsService').then(m => m.SettingsService.load());
            toastOpacity = Math.min(1, Math.max(0.3, Number(settings.toastOpacity ?? 0.95)));
            text = getUiText(settings.uiLanguage);
        } catch { }

        const notify = $(`<div id="autofeed-founddata-toast" style="position:fixed; bottom:10px; right:10px; z-index:99997; padding: 12px 14px; background: #4CAF50; color: white; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; max-width: 520px; pointer-events: auto; opacity:${toastOpacity};">
        <span style="font-size: 12px;">${text("转发数据", "Forwarding data")}: <strong>${meta.title}</strong></span>
        <button id="autofeed-fill-btn" style="background: white; color: #4CAF50; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-weight: bold;">${text("重新填充", "Fill again")}</button>
        <button id="autofeed-close-btn" style="background: transparent; color: white; border: 1px solid white; padding: 4px 8px; border-radius: 3px; cursor: pointer;">${text("关闭", "Close")}</button>
      </div>`);

        $('body').append(notify);

        const { normalizeMeta } = await import('../common/rules/normalize');
        const normalized = normalizeMeta(meta, adapter.siteName);
        let fillInFlight = false;

        const afterFill = async () => {
            try {
                const settings = await import('../services/SettingsService').then(m => m.SettingsService.load());
                this.applyDefaultAnonymousWithRetry(!!settings.defaultAnonymous);
            } catch {}
            try {
                AutoDownloadAfterUploadService.hookUploadForm(adapter, normalized).catch(() => {});
            } catch {}
        };

        const runFill = async (reason: string, force = false) => {
            if (fillInFlight) return;
            if (!force && adapter.isFillComplete()) return;
            fillInFlight = true;
            try {
                console.log(`[Auto-Feed][${adapter.siteName}] Autofill attempt: ${reason}`);
                await adapter.fill(normalized);
                await afterFill();
                if (adapter.isFillComplete()) {
                    notify.find('#autofeed-fill-btn').text(text('已自动填充', 'Form filled'));
                }
            } catch (e) {
                console.error(`[Auto-Feed] Auto Fill Error (${reason}):`, e);
            } finally {
                fillInFlight = false;
            }
        };

        // Auto-fill and keep recovering while target pages finish their own late DOM work.
        try {
            const ready = await this.waitForForm();
            if (ready) {
                await runFill('initial', true);
                this.scheduleFillRecovery(adapter, normalized, notify, runFill, text('已自动填充', 'Form filled'));
            }
        } catch (e) {
            console.error('[Auto-Feed] Auto Fill Error:', e);
        }

        notify.find('#autofeed-fill-btn').on('click', async () => {
            notify.find('#autofeed-fill-btn').text(text('填充中...', 'Filling...'));
            await runFill('manual', true);
            notify.find('#autofeed-fill-btn').text(text('已填充', 'Form filled'));
            setTimeout(() => notify.fadeOut(), 2000);
        });

        // 点击获取仅在源站转发处提供，上传页面不提供

        notify.find('#autofeed-close-btn').on('click', () => {
            notify.stop(true, true).fadeOut(150, () => notify.remove());
        });
    }

    private showStatusToast(message: string) {
        const toast = $(`<div style="position:fixed; bottom:60px; right:10px; z-index:9999; padding: 10px 12px; background: #e67e22; color: white; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); font-size: 12px;">
            ${message}
        </div>`);
        // Best-effort: apply toast opacity without blocking.
        try {
            import('../services/SettingsService')
                .then(m => m.SettingsService.load())
                .then((settings) => {
                    const o = Math.min(1, Math.max(0.3, Number(settings.toastOpacity ?? 0.95)));
                    toast.css('opacity', String(o));
                })
                .catch(() => { });
        } catch { }
        $('body').append(toast);
        setTimeout(() => toast.fadeOut(600, () => toast.remove()), 3000);
    }

    private cleanMeta(meta: any): any {
        let desc = meta?.description || '';

        desc = desc.replace(/\[url=[^\]]+\](\[img\].*?\[\/img\])\[\/url\]/gi, '$1');
        desc = desc.replace(/\[url\](\[img\].*?\[\/img\])\[\/url\]/gi, '$1');

        const footprints = [
            /Transferred by.*?/gi,
            /Uploaded by.*?/gi,
            /Reposted from.*?/gi,
            /\[quote\].*?Internal.*?\[\/quote\]/gis,
            /This torrent was uploaded by.*/gi,
            /Originally uploaded by.*/gi
        ];
        footprints.forEach((regex) => {
            desc = desc.replace(regex, '');
        });

        desc = desc.replace(/\[quote\]Thanks to.*?\[\/quote\]/gis, '');
        desc = desc.replace(/\[quote\]\s*\[\/quote\]/g, '');
        desc = desc.replace(/\n\s*\n\s*\n/g, '\n\n');

        return {
            ...meta,
            description: String(desc || '').trim()
        };
    }

    private async waitForForm(): Promise<boolean> {
        const selectors = [
            'input[name="name"]',
            'input#name',
            'input#titleauto',
            'input[name="title"]',
            'textarea[name="descr"]',
            'textarea[name="description"]',
            'textarea[name="info"]',
            'input[name="filename"]',
            'input[name="file_input"]',
            'input#catalogue_number',
            'input#cataloguenumber',
            'textarea[name="release_desc"]',
            'textarea#album_desc',
            'input[name="infosite"]',
            'input#ename',
            'input#cname',
            'input[name="external_url"]',
            'input#external_url',
            'select[name="browsecat"]',
            'input[name="torrentfile"]',
            'input[type="file"]#torrent',
            'input[name="torrent"]',
            'input[name="file"]',
            'input[type="file"][name*="file"]',
            '#torrent-input'
        ];

        for (let i = 0; i < 30; i++) {
            if (selectors.some((sel) => document.querySelector(sel))) return true;
            await new Promise((r) => setTimeout(r, 500));
        }
        return false;
    }

    private scheduleFillRecovery(
        adapter: BaseEngine,
        meta: any,
        notify: JQuery<HTMLElement>,
        runFill: (reason: string, force?: boolean) => Promise<void>,
        filledLabel: string
    ) {
        const retryDelays = [400, 1200, 2600, 4500, 7000, 10000];
        retryDelays.forEach((ms) => {
            window.setTimeout(() => {
                if (!adapter.isFillComplete()) {
                    runFill(`retry-${ms}`).catch(() => {});
                } else if (notify.find('#autofeed-fill-btn').length) {
                    notify.find('#autofeed-fill-btn').text(filledLabel);
                }
            }, ms);
        });

        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                window.setTimeout(() => {
                    if (!adapter.isFillComplete()) {
                        runFill('window-load').catch(() => {});
                    }
                }, 450);
            }, { once: true });
        }

        const MutationObserverCtor = window.MutationObserver || (window as any).WebKitMutationObserver;
        if (!MutationObserverCtor) return;

        let queued = 0;
        const observer = new MutationObserverCtor(() => {
            if (adapter.isFillComplete()) return;
            window.clearTimeout(queued);
            queued = window.setTimeout(() => {
                if (!adapter.isFillComplete()) {
                    runFill('mutation').catch(() => {});
                }
            }, 280);
        });
        observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
        window.setTimeout(() => observer.disconnect(), 15000);
    }

    private applyDefaultAnonymousOnce(enable: boolean): { applied: boolean; verified: boolean } {
        const attempt = (): { applied: boolean; verified: boolean } => {
            // Some sites use select-based anonymity.
            try {
                const sel = document.querySelector('select[name="anonymity"]') as HTMLSelectElement | null;
                if (sel) {
                    const want = enable ? 'yes' : 'no';
                    const opt = Array.from(sel.options).find((o) => (o.value || '').toLowerCase() === want);
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                        sel.dispatchEvent(new Event('input', { bubbles: true }));
                        return { applied: true, verified: (sel.value || '') === opt.value };
                    }
                }
            } catch {}

            // Some Nexus variants use `uplver` as radio group or checkbox.
            try {
                const uplver = Array.from(document.querySelectorAll('input[name="uplver"]')) as HTMLInputElement[];
                if (uplver.length) {
                    const anyRadio = uplver.some((e) => (e.type || '').toLowerCase() === 'radio');
                    if (anyRadio) {
                        const yes = uplver.find((e) => (e.value || '').match(/^(yes|1|true|on)$/i)) || uplver[0];
                        const no =
                            uplver.find((e) => (e.value || '').match(/^(no|0|false|off)$/i)) ||
                            uplver[1] ||
                            uplver[0];
                        const target = enable ? yes : no;
                        if (!target.disabled) {
                            try {
                                target.click();
                            } catch {
                                target.checked = true;
                            }
                        }
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        return { applied: true, verified: !!target.checked };
                    }
                    // Checkbox-like: set all matches (some pages duplicate it).
                    let verifiedAny = false;
                    uplver.forEach((el) => {
                        if (!el.disabled) {
                            try {
                                if (el.checked !== enable) el.click();
                            } catch {
                                el.checked = enable;
                            }
                        }
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        if (el.checked === enable) verifiedAny = true;
                    });
                    return { applied: true, verified: verifiedAny };
                }
            } catch {}

            // Generic radio-group anonymity (some sites use `anonymous` as radio with [No, Yes]).
            try {
                const names = ['anonymous', 'anon', 'anony', 'is_anonymous'];
                for (const n of names) {
                    const els = Array.from(document.querySelectorAll(`input[name="${n}"]`)) as HTMLInputElement[];
                    if (!els.length) continue;
                    const anyRadio = els.some((e) => (e.type || '').toLowerCase() === 'radio');
                    if (!anyRadio) continue;
                    const yes = els.find((e) => (e.value || '').match(/^(yes|1|true|on)$/i)) || els[1] || els[0];
                    const no = els.find((e) => (e.value || '').match(/^(no|0|false|off)$/i)) || els[0];
                    const target = enable ? yes : no;
                    if (!target.disabled) {
                        try {
                            target.click();
                        } catch {
                            target.checked = true;
                        }
                    }
                    target.dispatchEvent(new Event('change', { bubbles: true }));
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                    return { applied: true, verified: !!target.checked };
                }
            } catch {}

            // Best-effort across common PT upload forms (legacy parity: `uplver`).
            const selectors = [
                'input[type="checkbox"][name="uplver"]',
                'input[type="checkbox"]#uplver',
                'input[type="checkbox"][name="anonymous"]',
                'input[type="checkbox"][name="anon"]',
                'input[type="checkbox"]#anonymous',
                'input[type="checkbox"]#anon',
                'input[type="checkbox"][name="anony"]',
                'input[type="checkbox"][name="is_anonymous"]',
                // Unit3D-like variants
                'input[type="checkbox"][name="anonymous_upload"]',
                'input[type="checkbox"][name="upload_anonymous"]',
                'input[type="checkbox"][name="upload_anonymously"]',
                'input[type="checkbox"]#anonymous_upload'
            ];
            let applied = false;
            let verified = false;
            for (const sel of selectors) {
                const el = document.querySelector(sel) as HTMLInputElement | null;
                if (!el) continue;
                applied = true;
                if (!el.disabled) {
                    try {
                        if (el.checked !== enable) el.click();
                    } catch {
                        el.checked = enable;
                    }
                }
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('input', { bubbles: true }));
                verified = el.checked === enable;
                if (verified) return { applied, verified };
            }

            // Label-driven anonymity toggles (Unit3D and some modern forms).
            // Legacy parity: match by visible label text and click it if needed.
            try {
                const patterns = [/匿名上传/i, /Anonymous\\s*Upload/i, /^Anonymous$/i];
                const labels = Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
                for (const lab of labels) {
                    const text = (lab.textContent || '').replace(/\\s+/g, ' ').trim();
                    if (!text) continue;
                    if (!patterns.some((re) => re.test(text))) continue;

                    const forId = (lab.getAttribute('for') || '').trim();
                    const byFor = forId ? (document.getElementById(forId) as HTMLInputElement | null) : null;
                    const byChild = (lab.querySelector('input') as HTMLInputElement | null) || null;
                    const input = byFor || byChild;

                    // Avoid blind-clicking labels without an actual input: it can toggle twice under retries.
                    if (!input) continue;

                    const t = (input.type || '').toLowerCase();
                    if (t === 'checkbox') {
                        if (input.checked === enable) return { applied: true, verified: true };
                        applied = true;
                        if (!input.disabled) {
                            try {
                                lab.click();
                            } catch {
                                input.checked = enable;
                            }
                        } else {
                            input.checked = enable;
                        }
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        return { applied: true, verified: input.checked === enable };
                    }
                    if (t === 'radio') {
                        if (!enable) continue; // For radio groups, we only attempt to enable.
                        if (input.checked) return { applied: true, verified: true };
                        applied = true;
                        if (!input.disabled) {
                            try {
                                lab.click();
                            } catch {
                                input.checked = true;
                            }
                        } else {
                            input.checked = true;
                        }
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        return { applied: true, verified: !!input.checked };
                    }
                }
            } catch {}
            return { applied, verified };
        };
        return attempt();
    }

    private applyDefaultAnonymousWithRetry(enable: boolean, timeoutMs = 12_000, intervalMs = 450) {
        try {
            const startedAt = Date.now();
            let lastAppliedAt = 0;
            let verifiedStreak = 0;

            const tick = () => {
                const now = Date.now();
                if (now - lastAppliedAt < Math.max(200, Math.floor(intervalMs / 2))) return;
                lastAppliedAt = now;

                const r = this.applyDefaultAnonymousOnce(enable);
                if (r.verified) verifiedStreak++;
                if (verifiedStreak >= 2) return true;
                if (now - startedAt > timeoutMs) return true;
                return false;
            };

            // Immediate attempt + interval retries (for SPA/delayed forms).
            if (tick()) return;
            const timer = window.setInterval(() => {
                if (tick()) window.clearInterval(timer);
            }, intervalMs);
        } catch {}
    }
}
