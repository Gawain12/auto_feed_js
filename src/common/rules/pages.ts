// URL classification helpers shared by engines (no DOM access).

/** Last path segment, lowercased: `/foo/details.php` -> `details.php`. */
export function pageName(url: URL): string {
    return (url.pathname || '').split('/').pop()?.toLowerCase() || '';
}

/** True when the URL's last path segment is one of `names` (case-insensitive). */
export function isPage(url: URL, ...names: string[]): boolean {
    const current = pageName(url);
    return names.some((name) => name.toLowerCase() === current);
}

/** `?id=123` style detail query. Matches `torrentid=` too, like the legacy checks. */
export function hasIdQuery(url: URL): boolean {
    return /id=\d+/i.test(url.search || '');
}

export function hasTorrentIdQuery(url: URL): boolean {
    return /torrentid=\d+/i.test(url.search || '');
}

/** Generic detail page shapes used by NexusPHP / Unit3D / forum-like trackers. */
export function isGenericDetailPage(url: URL): boolean {
    const path = url.pathname || '';
    return (
        isPage(url, 'details.php', 'detail.php') ||
        /\/(?:threads|topics)(?:\/|$)/i.test(path) ||
        /\/torrents\/\d+(?:\/|$)/i.test(path) ||
        /\/detail\//i.test(path)
    );
}

/** Upload / offer / create pages where a forwarded fill may happen. */
export function isUploadLikeUrl(url: string): boolean {
    return /upload|offer|torrents\/create|torrents\/upload|torrent\/upload|torrents\/add|upload\.php|p_torrent\/video_upload|#\/torrent\/add|\/torrent\/add/i.test(url);
}
