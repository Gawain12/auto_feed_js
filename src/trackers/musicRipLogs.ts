import { RipLogEntry } from '../types/TorrentMeta';

const RIP_LOG_MARKERS =
    /Exact Audio Copy|EAC extraction logfile|X Lossless Decoder|XLD extraction logfile|whipper|CUERipper|dBpoweramp|Rubyripper|fre:ac|TOC of the extracted CD|Log checksum|END XLD SIGNATURE|Peak level\s+\d|Copy OK|Track\s+\d+\s+Filename/i;

export function isValidRipLogText(text: string): boolean {
    const clean = String(text || '').trim();
    return clean.length >= 120 && RIP_LOG_MARKERS.test(clean);
}

export function sanitizeLogBaseName(raw: string): string {
    const cleaned = String(raw || '')
        .replace(/[\\/:*?"<>|\[\]]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)
        .trim();
    return cleaned || 'rip';
}

export function ensureLogFilename(name: string, fallbackBase: string, index: number, total: number): string {
    const raw = String(name || '').trim();
    let base = raw
        .split(/[\\/]/)
        .pop()
        ?.replace(/\.(?:txt|log)$/i, '')
        .trim();
    if (!base) {
        const safe = sanitizeLogBaseName(fallbackBase);
        base = total > 1 ? `${safe} - CD${index + 1}` : safe;
    }
    return `${base.replace(/[\\/:*?"<>|]+/g, '_')}.log`;
}

/**
 * Parse OpenCD `#divnfo` text into one or more CD rip log entries.
 * OpenCD prepends `******************** Score : 100 ********************` before each disc log.
 */
export function parseOpenCdNfoLogs(nfoText: string, baseName: string): RipLogEntry[] {
    const raw = String(nfoText || '').replace(/\r\n/g, '\n').trim();
    if (!raw) return [];

    const scoreBannerRe = /\*{5,}\s*Score\s*:\s*[^\n*]+\*{5,}\s*/gi;
    const parts = scoreBannerRe.test(raw)
        ? raw.split(scoreBannerRe).map((s) => s.trim()).filter(Boolean)
        : [raw];

    const valid = parts.filter((part) => isValidRipLogText(part));
    return valid.map((content, idx) => ({
        filename: ensureLogFilename('', baseName, idx, valid.length),
        content: normalizeRipLogLineEndings(content)
    }));
}

export function normalizeRipLogLineEndings(text: string): string {
    const cleaned = String(text || '')
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
    // EAC logs are natively CRLF on Windows; XLD / whipper are LF.
    if (/Exact Audio Copy|EAC extraction logfile/i.test(cleaned)) {
        return `${cleaned.replace(/\n/g, '\r\n')}\r\n`;
    }
    return `${cleaned}\n`;
}

/**
 * Parse Gazelle `viewlog` (OPS / DIC / lztr) or `loglist` (RED) HTML into raw log download URLs
 * and inline `<pre>` / `<blockquote>` fallback entries.
 */
export function parseGazelleLogHtml(
    html: string,
    baseUrl: string,
    baseName: string
): { rawUrls: Array<{ url: string; filename: string }>; inlineLogs: RipLogEntry[] } {
    const rawUrls: Array<{ url: string; filename: string }> = [];
    const inlineLogs: RipLogEntry[] = [];
    if (!html || typeof DOMParser === 'undefined') return { rawUrls, inlineLogs };

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const seenUrls = new Set<string>();
    const abs = (href: string) => {
        try { return new URL(href, baseUrl).href; } catch { return href; }
    };

    // OPS (`view.php?type=riplog&id=...`) and DIC (`logs/12345_67890.log`) expose raw original log bytes!
    Array.from(doc.querySelectorAll('a[href]')).forEach((a) => {
        const href = (a.getAttribute('href') || '').trim();
        if (!href) return;
        const isRawLogLink =
            /view\.php\?[^#]*type=riplog/i.test(href) ||
            /(?:^|\/)logs\/[^?#]+\.(?:log|txt)(?:[?#]|$)/i.test(href);
        if (!isRawLogLink) return;
        const fullUrl = abs(href);
        if (seenUrls.has(fullUrl)) return;
        seenUrls.add(fullUrl);
        rawUrls.push({ url: fullUrl, filename: '' });
    });

    // Inline fallback (RED uses `<pre>` inside `torrents.php?action=loglist`; OPS/DIC also include `<pre>`).
    const seenText = new Set<string>();
    const collectText = (nodes: Element[]) => {
        for (const node of nodes) {
            const text = (node.textContent || '')
                .replace(/^Score\s*:.*?\(max\s*100\)\s*/i, '')
                .replace(/^得分\s*[:：]\s*\d+\s*/i, '')
                .trim();
            if (!isValidRipLogText(text)) continue;
            const sig = text.slice(0, 240);
            if (seenText.has(sig)) continue;
            seenText.add(sig);
            inlineLogs.push({
                filename: '',
                content: normalizeRipLogLineEndings(text)
            });
        }
    };

    const pres = Array.from(doc.querySelectorAll('pre'));
    if (pres.length) {
        collectText(pres);
    } else {
        collectText(Array.from(doc.querySelectorAll('.log_section blockquote, blockquote')));
    }

    rawUrls.forEach((entry, idx) => {
        entry.filename = ensureLogFilename(entry.url.split('/').pop()?.split('?')[0] || '', baseName, idx, rawUrls.length);
    });
    inlineLogs.forEach((entry, idx) => {
        entry.filename = ensureLogFilename('', baseName, idx, inlineLogs.length);
    });

    return { rawUrls, inlineLogs };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const pure = base64.includes(',') ? base64.split(',').slice(1).join(',') : base64;
    const binary = atob(pure);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response | null> {
    if (typeof fetch !== 'function') return null;
    try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
        const res = await fetch(url, { credentials: 'include', signal: controller?.signal });
        if (timer) window.clearTimeout(timer);
        return res.ok ? res : null;
    } catch {
        return null;
    }
}

export async function fetchGazelleRipLogs(
    siteName: string,
    currentUrl: string,
    torrentId: string,
    baseName: string
): Promise<RipLogEntry[]> {
    if (!torrentId || typeof fetch !== 'function') return [];

    let groupId = '';
    try {
        groupId = new URL(currentUrl).searchParams.get('id') || '';
    } catch {}

    const abs = (path: string) => {
        try { return new URL(path, currentUrl).href; } catch { return path; }
    };

    const endpoint =
        siteName === 'RED'
            ? abs(`torrents.php?action=loglist&torrentid=${encodeURIComponent(torrentId)}`)
            : abs(`torrents.php?action=viewlog&torrentid=${encodeURIComponent(torrentId)}${groupId ? `&groupid=${encodeURIComponent(groupId)}` : ''}`);

    const res = await fetchWithTimeout(endpoint, 6000);
    if (!res) return [];
    const html = await res.text();
    if (!html) return [];

    const { rawUrls, inlineLogs } = parseGazelleLogHtml(html, currentUrl, baseName);

    // Prefer raw log downloads (OPS / DIC) so exact original bytes (UTF-16LE / CRLF / checksum) are preserved.
    if (rawUrls.length) {
        const downloaded: RipLogEntry[] = [];
        for (let i = 0; i < rawUrls.length; i++) {
            const item = rawUrls[i];
            const rawRes = await fetchWithTimeout(item.url, 6000);
            if (!rawRes) continue;
            try {
                const buf = await rawRes.arrayBuffer();
                if (!buf.byteLength) continue;
                const cd = rawRes.headers.get('content-disposition') || '';
                const cdName = cd.match(/filename\*?=(?:UTF-8''|")?([^";\r\n"]+)/i)?.[1] || '';
                const filename = ensureLogFilename(cdName || item.filename, baseName, i, rawUrls.length);
                downloaded.push({
                    filename,
                    base64: `data:text/plain;base64,${arrayBufferToBase64(buf)}`
                });
            } catch {}
        }
        if (downloaded.length) return downloaded;
    }

    return inlineLogs;
}

function getPageFileCtor(): typeof File {
    try {
        const pageWin = (typeof (globalThis as any).unsafeWindow !== 'undefined'
            ? (globalThis as any).unsafeWindow
            : window) as any;
        if (typeof pageWin?.File === 'function') return pageWin.File;
        if (typeof (window as any)?.File === 'function') return (window as any).File;
    } catch {}
    return File;
}

function getPageDataTransfer(): DataTransfer | null {
    try {
        const pageWin = (typeof (globalThis as any).unsafeWindow !== 'undefined'
            ? (globalThis as any).unsafeWindow
            : window) as any;
        if (typeof pageWin?.DataTransfer === 'function') return new pageWin.DataTransfer();
        if (typeof (window as any)?.DataTransfer === 'function') return new (window as any).DataTransfer();
    } catch {}
    try {
        return new DataTransfer();
    } catch {
        return null;
    }
}

export function buildRipLogFiles(logs: RipLogEntry[]): File[] {
    const PageFile = getPageFileCtor();
    const out: File[] = [];
    for (let i = 0; i < logs.length; i++) {
        const entry = logs[i];
        if (!entry) continue;
        const filename = ensureLogFilename(entry.filename, 'rip', i, logs.length);
        if (entry.base64) {
            try {
                const bytes = base64ToUint8Array(entry.base64);
                out.push(new PageFile([bytes], filename, { type: 'text/plain' }));
                continue;
            } catch {}
        }
        if (entry.content) {
            out.push(new PageFile([entry.content], filename, { type: 'text/plain' }));
        }
    }
    return out;
}

function assignFilesToInput(input: HTMLInputElement, files: File[]): boolean {
    const dt = getPageDataTransfer();
    if (!dt) return false;
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

/**
 * Inject CD `.log` files into RED / OPS / DIC upload forms (`input[name="logfiles[]"]`).
 */
export function injectGazelleRipLogs(logs?: RipLogEntry[]): boolean {
    if (!logs || !logs.length) return false;
    const inputs = Array.from(document.querySelectorAll('input[type="file"][name="logfiles[]"]')) as HTMLInputElement[];
    if (!inputs.length) return false;
    // Do not overwrite logs the user already selected manually.
    if (inputs.some((inp) => inp.files && inp.files.length > 0)) return true;

    const files = buildRipLogFiles(logs);
    if (!files.length) return false;

    const first = inputs[0];
    if (first.multiple || files.length === 1) {
        return assignFilesToInput(first, files);
    }

    // Fallback for single-file Gazelle forks: click AddLogField() for each extra disc.
    const addBtn = document.querySelector('a[onclick*="AddLogField"]') as HTMLElement | null;
    for (let i = 0; i < files.length; i++) {
        let curInputs = Array.from(document.querySelectorAll('input[type="file"][name="logfiles[]"]')) as HTMLInputElement[];
        if (i >= curInputs.length && addBtn) {
            addBtn.click();
            curInputs = Array.from(document.querySelectorAll('input[type="file"][name="logfiles[]"]')) as HTMLInputElement[];
        }
        const target = curInputs[i];
        if (target) assignFilesToInput(target, [files[i]]);
    }
    return true;
}

/**
 * Inject CD `.log` files into OpenCD `plugin_upload.php` (`input[name="nfo1"]` + `#nfoadd`).
 */
export function injectOpenCdRipLogs(logs?: RipLogEntry[]): boolean {
    if (!logs || !logs.length) return false;
    const existingInputs = Array.from(document.querySelectorAll('input[type="file"][name^="nfo"]')) as HTMLInputElement[];
    if (!existingInputs.length) return false;
    if (existingInputs.some((inp) => inp.files && inp.files.length > 0)) return true;

    const files = buildRipLogFiles(logs);
    if (!files.length) return false;

    const addBtn = document.getElementById('nfoadd') as HTMLElement | null;
    for (let i = 0; i < files.length; i++) {
        let curInputs = Array.from(document.querySelectorAll('input[type="file"][name^="nfo"]')) as HTMLInputElement[];
        if (i >= curInputs.length && addBtn) {
            addBtn.click();
            curInputs = Array.from(document.querySelectorAll('input[type="file"][name^="nfo"]')) as HTMLInputElement[];
        }
        const target = curInputs[i] || curInputs[curInputs.length - 1];
        if (target) assignFilesToInput(target, [files[i]]);
    }
    return true;
}
