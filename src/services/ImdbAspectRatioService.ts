import { extractImdbId } from '../common/rules/links';
import { GMAdapter } from './GMAdapter';

type ImdbAspectRatioCache = {
    aspectRatio: string;
    updatedAt: number;
    sourceUrl?: string;
};

export class ImdbAspectRatioService {
    private static readonly CACHE_PREFIX = 'autofeed_imdb_aspect_';
    private static readonly HELPER_PARAM = 'autofeed_cache_imdb';
    private static readonly CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

    private static cacheKey(imdbId: string): string {
        return `${this.CACHE_PREFIX}${extractImdbId(imdbId)}`;
    }

    static normalizeAspectRatio(value: unknown): string {
        if (typeof value !== 'string' && typeof value !== 'number') return '';
        const raw = String(value).replace(/\s+/g, ' ').trim();
        const ratio = raw.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
        if (ratio) {
            const width = Number(ratio[1]);
            const height = Number(ratio[2]);
            return width > 0 && height > 0 ? width + ':' + height : '';
        }
        // Accept a bare ratio, not arbitrary text, object strings or dates.
        if (!/^\d+(?:\.\d+)?$/.test(raw)) return '';
        const decimal = Number(raw);
        return decimal > 0 && decimal < 10 ? Number(decimal.toFixed(3)) + ':1' : '';
    }

    static extractFromText(text: string): string {
        const source = String(text || '');
        const ratio =
            source.match(/Aspect\s*ratio[\s\S]{0,120}?([0-9.]+\s*:\s*[0-9.]+)/i)?.[1] ||
            source.match(/"aspectRatio"\s*:\s*"([^"\n]+)"/i)?.[1] || '';
        return this.normalizeAspectRatio(ratio);
    }

    private static pickAspectRatioFromJson(obj: unknown): string {
        if (!obj || typeof obj !== 'object') return '';
        if (Array.isArray(obj)) {
            for (const item of obj) {
                const hit = this.pickAspectRatioFromJson(item);
                if (hit) return hit;
            }
            return '';
        }
        const record = obj as Record<string, unknown>;
        const direct = this.normalizeAspectRatio(record.aspectRatio ?? record.aspect_ratio);
        if (direct) return direct;
        for (const value of Object.values(record)) {
            const hit = this.pickAspectRatioFromJson(value);
            if (hit) return hit;
        }
        return '';
    }

    static extractFromPageData(page: any): string {
        const title = page?.contentData?.data?.title;
        const candidates = [
            title?.technicalSpecifications?.aspectRatios,
            title?.aspectRatios,
            page?.mainColumnData?.technicalSpecifications?.aspectRatios,
            page?.mainColumnData?.aspectRatios,
            page?.aboveTheFoldData?.aspectRatios
        ];
        for (const candidate of candidates) {
            const hit = this.pickAspectRatioFromJson(candidate);
            if (hit) return hit;
        }
        return '';
    }

    static extractFromDocument(doc: Document = document): string {
        // The technical page has a stable field marker even when its label is localized.
        for (const node of Array.from(doc.querySelectorAll(
            '[data-testid="title-techspec_aspectratio"], [data-testid="title-techspecs_aspectratio"], #aspectratio'
        ))) {
            const content = node.querySelector('.ipc-metadata-list-item__content-container') || node;
            const hit = this.normalizeAspectRatio(content.textContent || '');
            if (hit) return hit;
        }

        // Read only this title's data. Other titles in recommendation widgets may have different ratios.
        for (const script of Array.from(doc.querySelectorAll('script#__NEXT_DATA__'))) {
            try {
                const page = JSON.parse(script.textContent || '{}')?.props?.pageProps;
                const hit = this.extractFromPageData(page);
                if (hit) return hit;
            } catch {}
        }
        for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
            try {
                const json = JSON.parse(script.textContent || '{}');
                const nodes = Array.isArray(json) ? json : json['@graph'] || [json];
                for (const node of nodes) {
                    if (!/^(Movie|TVSeries|TVMiniSeries)$/i.test(String(node?.['@type'] || ''))) continue;
                    const hit = this.normalizeAspectRatio(node.aspectRatio) ||
                        this.pickAspectRatioFromJson(node.technicalSpecifications?.aspectRatios || node.aspectRatios);
                    if (hit) return hit;
                }
            } catch {}
        }
        for (const node of Array.from(doc.querySelectorAll('li.ipc-metadata-list__item, tr'))) {
            const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
            if (!/^Aspect\s*ratio/i.test(text)) continue;
            const hit = this.extractFromText(text);
            if (hit) return hit;
        }
        return '';
    }

    static async fetchAspectRatio(imdbIdOrUrl: string): Promise<string> {
        const id = extractImdbId(imdbIdOrUrl);
        if (!id) return '';
        const urls = [
            `https://www.imdb.com/title/${id}/technical/?ref_=tt_spec_sm`,
            `https://www.imdb.com/title/${id}/`
        ];
        for (const url of urls) {
            try {
                const resp = await GMAdapter.xmlHttpRequest({
                    method: 'GET',
                    url,
                    headers: {
                        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'accept-language': 'en-US,en;q=0.9'
                    },
                    timeout: 10000
                });
                if (resp?.status !== 200) continue;
                const html = resp.responseText || '';
                if (!html) continue;
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const fromDoc = this.extractFromDocument(doc);
                if (fromDoc) {
                    await this.saveCachedAspectRatio(id, fromDoc, url);
                    return fromDoc;
                }
            } catch {}
        }
        return '';
    }

    static async saveCachedAspectRatio(imdbId: string, aspectRatio: string, sourceUrl?: string): Promise<void> {
        const id = extractImdbId(imdbId);
        const normalized = this.normalizeAspectRatio(aspectRatio);
        if (!id || !normalized) return;
        const payload: ImdbAspectRatioCache = {
            aspectRatio: normalized,
            updatedAt: Date.now(),
            sourceUrl
        };
        await GMAdapter.setValue(this.cacheKey(id), JSON.stringify(payload));
    }

    static async getCachedAspectRatio(imdbId: string): Promise<string> {
        const id = extractImdbId(imdbId);
        if (!id) return '';
        const raw = await GMAdapter.getValue<string | null>(this.cacheKey(id), null);
        if (!raw) return '';
        try {
            const payload = JSON.parse(raw) as ImdbAspectRatioCache;
            if (!payload?.aspectRatio) return '';
            if (!payload.updatedAt || Date.now() - payload.updatedAt > this.CACHE_TTL_MS) return '';
            return this.normalizeAspectRatio(payload.aspectRatio);
        } catch {
            return '';
        }
    }

    static async waitForCachedAspectRatio(imdbId: string, timeoutMs = 8000): Promise<string> {
        const id = extractImdbId(imdbId);
        if (!id) return '';
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const hit = await this.getCachedAspectRatio(id);
            if (hit) return hit;
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        return '';
    }

    static primeFromImdbUrl(imdbUrl: string): void {
        const id = extractImdbId(imdbUrl);
        if (!id) return;
        const helperUrl = new URL(`https://www.imdb.com/title/${id}/technical/`);
        helperUrl.searchParams.set(this.HELPER_PARAM, '1');
        const helper = window.open(helperUrl.toString(), 'autofeed-imdb-aspect-helper');
        try { helper?.blur(); } catch {}
        try { window.focus(); } catch {}
    }

    static async tryHandleCurrentPage(): Promise<void> {
        const imdbId = extractImdbId(window.location.href);
        if (!imdbId || !/imdb\.com$/i.test(window.location.hostname)) return;

        let finished = false;
        const persist = async () => {
            if (finished) return;
            const aspectRatio = this.extractFromDocument(document);
            if (!aspectRatio) return;
            finished = true;
            await this.saveCachedAspectRatio(imdbId, aspectRatio, window.location.href);
            const parsed = new URL(window.location.href);
            if (parsed.searchParams.get(this.HELPER_PARAM) === '1') {
                setTimeout(() => {
                    try { window.close(); } catch {}
                }, 250);
            }
        };

        await persist();
        if (finished) return;

        const observer = new MutationObserver(() => {
            persist().catch(() => {});
            if (finished) observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        const started = Date.now();
        const timer = window.setInterval(() => {
            persist().catch(() => {});
            if (finished || Date.now() - started > 15000) {
                observer.disconnect();
                window.clearInterval(timer);
            }
        }, 500);
    }
}
