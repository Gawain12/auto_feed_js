// Pure URL/response helpers for RemoteDownloadService (no DOM/GM dependencies).

/**
 * Extract the torrent ID from a tracker detail page URL (`?torrentid=123`).
 */
export function extractPageTorrentId(url: string): string {
    try {
        const u = new URL(url, 'https://example.invalid');
        const tid = u.searchParams.get('torrentid') || '';
        if (/^\d+$/.test(tid)) return tid;
    } catch {}
    return url.match(/[?&]torrentid=(\d+)/i)?.[1] || '';
}

/**
 * Extract the torrent ID from a tracker download URL.
 * Supports both `?torrentid=123` and Gazelle/Nexus `?action=download&id=123` / `download.php?id=123`.
 */
export function extractDownloadTorrentId(url: string): string {
    const raw = String(url || '').trim();
    if (!raw) return '';
    try {
        const u = new URL(raw, 'https://example.invalid');
        const tid = u.searchParams.get('torrentid') || '';
        if (/^\d+$/.test(tid)) return tid;
        const id = u.searchParams.get('id') || '';
        if (/^\d+$/.test(id)) return id;
    } catch {}
    return raw.match(/[?&](?:torrentid|id)=(\d+)/i)?.[1] || '';
}

/**
 * Whether a cached TorrentMeta entry belongs to the current page URL.
 * Prevents pushing a stale torrent cached from an earlier page or different site.
 */
export function isSameTorrentPageUrl(cachedUrl: string | undefined, currentUrl: string): boolean {
    if (!cachedUrl || !currentUrl) return false;
    try {
        const a = new URL(cachedUrl);
        const b = new URL(currentUrl);
        if (a.origin !== b.origin || a.pathname !== b.pathname) return false;
        const aTid = a.searchParams.get('torrentid') || '';
        const bTid = b.searchParams.get('torrentid') || '';
        if (aTid || bTid) return aTid === bTid;
        const aId = a.searchParams.get('id') || '';
        const bId = b.searchParams.get('id') || '';
        if (aId || bId) return aId === bId;
        return true;
    } catch {
        return cachedUrl === currentUrl;
    }
}

/**
 * Quick sanity check for downloaded `.torrent` binary payload.
 * Valid bencoded torrent dictionaries start with `d` (0x64), while tracker login/error pages start with HTML.
 */
export function looksLikeTorrentBytes(bytes: Uint8Array): boolean {
    if (!bytes || bytes.length < 16) return false;
    // Bencoded dictionary starts with 'd' (0x64).
    if (bytes[0] === 0x64) return true;
    // Reject obvious HTML/text error responses (skip optional BOM/whitespace).
    let i = 0;
    while (i < bytes.length && i < 32 && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0xef || bytes[i] === 0xbb || bytes[i] === 0xbf)) {
        i++;
    }
    if (bytes[i] === 0x3c) return false; // '<' (HTML/XML)
    return false;
}
